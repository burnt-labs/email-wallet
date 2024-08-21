
pragma circom 2.1.5;

include "@zk-email/circuits/email-verifier.circom";
include "@zk-email/circuits/utils/constants.circom";
include "@zk-email/circuits/utils/regex.circom";
include "@zk-email/zk-regex-circom/circuits/common/from_addr_regex.circom";
include "./tx_auth_core.circom";

// Verify email from user (sender) and extract subject, timestmap, recipient email (commitment), etc.
// * n - the number of bits in each chunk of the RSA public key (modulust)
// * k - the number of chunks in the RSA public key (n * k > 2048)
// * maxHeaderBytes - max number of bytes in the email header
// * txBodyMaxBytes - max number of bytes in the tx body
template TxAuthHeaderOnly(n, k, maxHeaderBytes, txBodyMaxBytes) {
    signal input emailHeader[maxHeaderBytes];
    signal input emailHeaderLength;
    signal input pubkey[k];
    signal input signature[k];
    
    signal input txBodyIdx;
    signal input senderEmailIdx;
    signal input emailSaltIdx;
    
    signal output txBodyHash;
    signal output emailCommitment;
    signal output pubkeyHash;

    // verify email signature
    component EV = EmailVerifier(maxHeaderBytes, 0, n, k, 1, 0, 0);
    EV.emailHeader <== emailHeader;
    EV.emailHeaderLength <== emailHeaderLength;
    EV.pubkey <== pubkey;
    EV.signature <== signature;
    pubkeyHash <== EV.pubkeyHash;

    // FROM HEADER REGEX
    signal fromRegexOut, fromRegexReveal[maxHeaderBytes];
    (fromRegexOut, fromRegexReveal) <== FromAddrRegex(maxHeaderBytes)(emailHeader);
    fromRegexOut === 1;
    signal senderEmailAddr[EMAIL_ADDR_MAX_BYTES()];
    senderEmailAddr <== SelectRegexReveal(maxHeaderBytes, EMAIL_ADDR_MAX_BYTES())(fromRegexReveal, senderEmailIdx);

    (emailCommitment, txBodyHash) <== TxAuthCore(maxHeaderBytes, txBodyMaxBytes)
        (emailHeader, senderEmailAddr, txBodyIdx, emailSaltIdx);
}