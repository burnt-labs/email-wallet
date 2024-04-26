
pragma circom 2.1.5;

include "@zk-email/circuits/email-verifier.circom";
include "@zk-email/circuits/utils/constants.circom";
include "@zk-email/circuits/utils/bytes.circom";
include "@zk-email/circuits/utils/regex.circom";
include "@zk-email/zk-regex-circom/circuits/common/from_addr_regex.circom";
include "./regexes/tx_body_and_salt.circom";
include "./utils/commit.circom";

// Verify email from user (sender) and extract subject, timestmap, recipient email (commitment), etc.
// * n - the number of bits in each chunk of the RSA public key (modulust)
// * k - the number of chunks in the RSA public key (n * k > 2048)
// * max_header_bytes - max number of bytes in the email header
// * max_body_bytes - max number of bytes in the email subject
template TxAuthHeaderOnly(n, k, max_header_bytes, max_body_bytes, tx_body_max_bytes) {
    signal input in_padded[max_header_bytes];
    signal input in_len_padded_bytes;
    signal input pubkey[k];
    signal input signature[k];
    signal input tx_body_idx;
    signal input sender_email_idx;
    signal input email_salt_idx;
    
    signal output tx_body_hash;
    signal output email_commitment; // hash(email_salt, sender_email_addr)
    signal output pubkey_hash;

    var email_max_bytes = EMAIL_ADDR_MAX_BYTES();
    var num_email_addr_ints = computeIntChunkLength(email_max_bytes);
    var num_tx_body_ints = computeIntChunkLength(tx_body_max_bytes);
    var salt_max_bytes = 31; // one field for the salt

    // verify email signature
    component EV = EmailVerifier(max_header_bytes, 0, n, k, 1);
    EV.emailHeader <== in_padded;
    EV.emailHeaderLength <== in_len_padded_bytes;
    EV.pubkey <== pubkey;
    EV.signature <== signature;
    pubkey_hash <== EV.pubkeyHash;

    // FROM HEADER REGEX
    signal from_regex_out, from_regex_reveal[max_header_bytes];
    (from_regex_out, from_regex_reveal) <== FromAddrRegex(max_header_bytes)(in_padded);
    from_regex_out === 1;
    signal sender_email_addr[email_max_bytes];
    sender_email_addr <== SelectRegexReveal(max_header_bytes, email_max_bytes)(from_regex_reveal, sender_email_idx);

    // TX DATA REGEX - extract email salt and tx body
    signal tx_regex_out, tx_body_reveal[max_header_bytes], email_salt_reveal[max_header_bytes];
    (tx_regex_out, email_salt_reveal, tx_body_reveal) <== TxBodyAndSaltRegex(max_header_bytes)(in_padded);
    signal email_salt[salt_max_bytes];
    email_salt <== SelectRegexReveal(max_header_bytes, salt_max_bytes)(email_salt_reveal, email_salt_idx);
    signal tx_body[tx_body_max_bytes];
    tx_body <== SelectRegexReveal(max_header_bytes, tx_body_max_bytes)(tx_body_reveal, tx_body_idx);
    
    // Expose email commitment - hash(email_salt, sender_email_addr)
    signal sender_email_addr_ints[num_email_addr_ints] <== PackBytes(email_max_bytes)(sender_email_addr);
    signal salt_ints[1] <== PackBytes(salt_max_bytes)(email_salt);
    email_commitment <== EmailAddrCommit(num_email_addr_ints)(salt_ints[0], sender_email_addr_ints);

    // Expose tx body commitment - hash(tx_body)
    signal tx_body_ints[num_tx_body_ints] <== PackBytes(tx_body_max_bytes)(tx_body);
    tx_body_hash <== TxBodyCommit(num_tx_body_ints)(tx_body_ints);

}
