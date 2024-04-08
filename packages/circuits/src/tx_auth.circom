
pragma circom 2.1.5;

include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";
include "@zk-email/circuits/email-verifier.circom";
include "@zk-email/circuits/helpers/extract.circom";
include "./utils/constants.circom";
include "./utils/email_addr_pointer.circom";
include "./utils/email_addr_commit.circom";
include "./utils/hash_sign.circom";
include "./utils/email_nullifier.circom";
include "./utils/bytes2ints.circom";
include "./utils/digit2int.circom";
include "./utils/tx_body_commit.circom";
include "./utils/remove_newlines.circom";
include "@zk-email/zk-regex-circom/circuits/common/from_addr_regex.circom";
include "@zk-email/zk-regex-circom/circuits/common/email_addr_regex.circom";
include "@zk-email/zk-regex-circom/circuits/common/email_domain_regex.circom";
include "@zk-email/zk-regex-circom/circuits/common/subject_all_regex.circom";
include "@zk-email/zk-regex-circom/circuits/common/timestamp_regex.circom";
include "./regexes/tx_body_and_salt_regex.circom";
include "./regexes/tx_data_regex.circom";

// Verify email from user (sender) and extract subject, timestmap, recipient email (commitment), etc.
// * n - the number of bits in each chunk of the RSA public key (modulust)
// * k - the number of chunks in the RSA public key (n * k > 2048)
// * max_header_bytes - max number of bytes in the email header
// * max_body_bytes - max number of bytes in the email subject
// * tx_body_max_bytes - max number of bytes in the tx body
// * max_tx_data_line_bytes - max number of bytes in the tx data line
// * max_tx_data_lines - max number of tx data lines
template TransactionAuth(
    n, 
    k, 
    max_header_bytes, 
    max_body_bytes, 
    tx_body_max_bytes,
    max_tx_data_line_bytes, 
    max_tx_data_lines
    ) {

    // header inputs
    signal input in_padded[max_header_bytes];
    signal input in_len_padded_bytes;
    signal input pubkey[k];
    signal input signature[k];
    
    // body inputs
    signal input in_body_padded[max_body_bytes];
    signal input in_body_len_padded_bytes;
    signal input body_hash_idx;
    signal input precomputed_sha[32];

    // idx inputs
    signal input tx_data_idx;
    signal input tx_body_idx;
    signal input sender_email_idx;
    signal input email_salt_idx;

    signal output tx_body_hash;
    signal output email_commitment; // hash(email_salt, sender_email_addr)
    signal output pubkey_hash;

    var email_max_bytes = email_max_bytes_const();
    var num_email_addr_ints = compute_ints_size(email_max_bytes);
    var num_tx_body_ints = compute_ints_size(tx_body_max_bytes);
    var salt_max_bytes = email_salt_max_bytes_const();
    var max_tx_data_bytes = max_tx_data_line_bytes * max_tx_data_lines; // including \r\n
    var max_tx_data_bytes_no_newlines = (max_tx_data_line_bytes - 2) * max_tx_data_lines; // excluding \r\n

    // verify email signature
    component EV = EmailVerifier(max_header_bytes, max_body_bytes, n, k, 0);
    EV.in_padded <== in_padded;
    EV.pubkey <== pubkey;
    EV.signature <== signature;
    EV.in_len_padded_bytes <== in_len_padded_bytes;
    EV.body_hash_idx <== body_hash_idx;
    EV.precomputed_sha <== precomputed_sha;
    EV.in_body_padded <== in_body_padded;
    EV.in_body_len_padded_bytes <== in_body_len_padded_bytes;
    pubkey_hash <== EV.pubkey_hash; 

    // FROM HEADER REGEX
    signal from_regex_out, from_regex_reveal[max_header_bytes];
    (from_regex_out, from_regex_reveal) <== FromAddrRegex(max_header_bytes)(in_padded);
    from_regex_out === 1;
    signal sender_email_addr[email_max_bytes];
    sender_email_addr <== VarShiftMaskedStr(max_header_bytes, email_max_bytes)(from_regex_reveal, sender_email_idx);

    // extract the raw tx data from the email body including the \r\n
    signal (raw_tx_data_regex_out, raw_tx_data_reveal[max_body_bytes]) <== TxDataRegex(max_body_bytes)(in_body_padded);
    raw_tx_data_regex_out === 1;
    signal raw_tx_data_shifted[max_tx_data_bytes] <==  VarShiftMaskedStr(max_body_bytes, max_tx_data_bytes)(
        raw_tx_data_reveal, 
        tx_data_idx);
    
    // remove newlines from raw tx data
    signal tx_data[max_tx_data_bytes_no_newlines] <== RemoveNewLines(max_tx_data_line_bytes, 
        max_tx_data_lines)(raw_tx_data_shifted);

    // extract tx body and email salt from tx data
    signal tx_regex_out, tx_body_reveal[max_tx_data_bytes_no_newlines];
    signal email_salt_reveal[max_tx_data_bytes_no_newlines];
    (tx_regex_out, email_salt_reveal, tx_body_reveal) <== TxBodyAndSaltRegex(max_tx_data_bytes_no_newlines)(tx_data);
    signal email_salt[salt_max_bytes];
    email_salt <== VarShiftMaskedStr(max_tx_data_bytes_no_newlines, salt_max_bytes)(email_salt_reveal, email_salt_idx);
    signal output tx_body[tx_body_max_bytes];
    tx_body <== VarShiftMaskedStr(max_tx_data_bytes_no_newlines, tx_body_max_bytes)(tx_body_reveal, tx_body_idx);

    // Expose email commitment - hash(email_salt, sender_email_addr)
    signal sender_email_addr_ints[num_email_addr_ints] <== Bytes2Ints(email_max_bytes)(sender_email_addr);
    signal salt_ints[1] <== Bytes2Ints(salt_max_bytes)(email_salt);
    email_commitment <== EmailAddrCommit(num_email_addr_ints)(salt_ints[0], sender_email_addr_ints);

    // Expose tx body commitment - hash(tx_body)
    signal tx_body_ints[num_tx_body_ints] <== Bytes2Ints(tx_body_max_bytes)(tx_body);
    tx_body_hash <== TxBodyCommit(num_tx_body_ints)(tx_body_ints);

}
// Args:
// * n = 121 is the number of bits in each chunk of the modulus (RSA parameter)
// * k = 17 is the number of chunks in the modulus (RSA parameter)
// * max_header_bytes = 1024 is the max number of bytes in the header
// * max_subject_bytes = 512 is the max number of bytes in the body after precomputed slice
component main  = TransactionAuth(121, 17, 1024, 2048, 512, 70, 10);
