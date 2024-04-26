
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
// * maxHeaderBytes - max number of bytes in the email header
// * txBoydMaxBytes - max number of bytes in the tx body
template TxAuthHeaderOnly(n, k, maxHeaderBytes, txBoydMaxBytes) {
    signal input emailHeader[maxHeaderBytes];
    signal input emaiHeaderLength;
    signal input pubkey[k];
    signal input signature[k];
    
    signal input txBodyIdx;
    signal input senderEmailIdx;
    signal input emailSaltIdx;
    
    signal output txBodyHash;
    signal output emailCommitment;
    signal output pubkeyHash;

    var numEmailAddrInts = computeIntChunkLength(EMAIL_ADDR_MAX_BYTES());
    var numTxBodyInts = computeIntChunkLength(txBoydMaxBytes);
    var saltMaxBytes = 31; // one field for the salt

    // verify email signature
    component EV = EmailVerifier(maxHeaderBytes, 0, n, k, 1);
    EV.emailHeader <== emailHeader;
    EV.emailHeaderLength <== emaiHeaderLength;
    EV.pubkey <== pubkey;
    EV.signature <== signature;
    pubkeyHash <== EV.pubkeyHash;

    // FROM HEADER REGEX
    signal fromRegexOut, fromRegexReveal[maxHeaderBytes];
    (fromRegexOut, fromRegexReveal) <== FromAddrRegex(maxHeaderBytes)(emailHeader);
    fromRegexOut === 1;
    signal senderEmailAddr[EMAIL_ADDR_MAX_BYTES()];
    senderEmailAddr <== SelectRegexReveal(maxHeaderBytes, EMAIL_ADDR_MAX_BYTES())(fromRegexReveal, senderEmailIdx);

    // TX DATA REGEX - extract email salt and tx body
    signal txRegexOut, txBodyReveal[maxHeaderBytes], emailSaltReveal[maxHeaderBytes];
    (txRegexOut, emailSaltReveal, txBodyReveal) <== TxBodyAndSaltRegex(maxHeaderBytes)(emailHeader);
    signal emailSalt[saltMaxBytes];
    emailSalt <== SelectRegexReveal(maxHeaderBytes, saltMaxBytes)(emailSaltReveal, emailSaltIdx);
    signal txBody[txBoydMaxBytes];
    txBody <== SelectRegexReveal(maxHeaderBytes, txBoydMaxBytes)(txBodyReveal, txBodyIdx);
    
    // Expose email commitment
    signal senderEmailAddrInts[numEmailAddrInts] <== PackBytes(EMAIL_ADDR_MAX_BYTES())(senderEmailAddr);
    signal saltInts[1] <== PackBytes(saltMaxBytes)(emailSalt);
    emailCommitment <== EmailAddrCommit(numEmailAddrInts)(saltInts[0], senderEmailAddrInts);

    // Expose tx body commitment
    signal txBodyInts[numTxBodyInts] <== PackBytes(txBoydMaxBytes)(txBody);
    txBodyHash <== TxBodyCommit(numTxBodyInts)(txBodyInts);

}
