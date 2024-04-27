
pragma circom 2.1.5;

include "@zk-email/circuits/email-verifier.circom";
include "@zk-email/circuits/utils/constants.circom";
include "@zk-email/circuits/utils/bytes.circom";
include "@zk-email/circuits/utils/regex.circom";
include "@zk-email/zk-regex-circom/circuits/common/from_addr_regex.circom";
include "./regexes/tx_data.circom";
include "./utils/newline.circom";
include "./tx_auth_core.circom";

// Verify email from user (sender) and extract subject, timestmap, recipient email (commitment), etc.
// * n - the number of bits in each chunk of the RSA public key (modulust)
// * k - the number of chunks in the RSA public key (n * k > 2048)
// * max_header_bytes - max number of bytes in the email header
// * max_body_bytes - max number of bytes in the email subject
// * tx_body_max_bytes - max number of bytes in the tx body
// * max_tx_data_line_bytes - max number of bytes in the tx data line
// * max_tx_data_lines - max number of tx data lines
template TxAuth(
    n, 
    k, 
    maxHeaderBytes, 
    maxBodyBytes, 
    txBodyMaxBytes,
    maxTxDataLineBytes, 
    maxTxDataLines
    ) {

    // header inputs
    signal input emailHeader[maxHeaderBytes];
    signal input emailHeaderLength;
    signal input pubkey[k];
    signal input signature[k];
    
    // body inputs
    signal input emailBody[maxBodyBytes];
    signal input emailBodyLength;
    signal input bodyHashIndex;
    signal input precomputedSHA[32];

    // idx inputs
    signal input txDataIdx;
    signal input txBodyIdx;
    signal input senderEmailIdx;
    signal input emailSaltIdx;

    signal output txBodyHash;
    signal output emailCommitment;
    signal output pubkeyHash;

    var maxTxDataBytes = maxTxDataLineBytes * maxTxDataLines; // including \r\n
    var maxTxDataBytesNoNewlines = (maxTxDataLineBytes - 2) * maxTxDataLines; // excluding \r\n

    // verify email signature
    component EV = EmailVerifier(maxHeaderBytes, maxBodyBytes, n, k, 0);
    EV.emailHeader <== emailHeader;
    EV.pubkey <== pubkey;
    EV.signature <== signature;
    EV.emailHeaderLength <== emailHeaderLength;
    EV.bodyHashIndex <== bodyHashIndex;
    EV.precomputedSHA <== precomputedSHA;
    EV.emailBody <== emailBody;
    EV.emailBodyLength <== emailBodyLength;
    pubkeyHash <== EV.pubkeyHash; 

    // FROM HEADER REGEX
    signal fromRegexOut, fromRegexReveal[maxHeaderBytes];
    (fromRegexOut, fromRegexReveal) <== FromAddrRegex(maxHeaderBytes)(emailHeader);
    fromRegexOut === 1;
    signal senderEmailAddr[EMAIL_ADDR_MAX_BYTES()];
    senderEmailAddr <== SelectRegexReveal(maxHeaderBytes, EMAIL_ADDR_MAX_BYTES())(fromRegexReveal, senderEmailIdx);

    // extract the raw tx data from the email body including the \r\n
    signal (rawTxDataRegexOut, rawTxDataReveal[maxBodyBytes]) <== TxDataRegex(maxBodyBytes)(emailBody);
    rawTxDataRegexOut === 1;
    signal rawTxData[maxTxDataBytes] <== SelectRegexReveal(maxBodyBytes, maxTxDataBytes)(
        rawTxDataReveal, 
        txDataIdx);
    
    // remove newlines from raw tx data
    signal txData[maxTxDataBytesNoNewlines] <== RemoveNewLines(maxTxDataLineBytes, 
        maxTxDataLines)(rawTxData);

    (emailCommitment, txBodyHash) <== TxAuthCore(maxTxDataBytesNoNewlines, txBodyMaxBytes)
        (txData, senderEmailAddr, txBodyIdx, emailSaltIdx);

}
