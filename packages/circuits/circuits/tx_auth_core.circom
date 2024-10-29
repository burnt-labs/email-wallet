pragma circom 2.1.5;

include "@zk-email/circuits/utils/constants.circom";
include "@zk-email/circuits/utils/bytes.circom";
include "@zk-email/circuits/utils/regex.circom";
include "@zk-email/circuits/utils/hash.circom";
include "./utils/commit.circom";
include "./regexes/tx_body_and_salt.circom";

template TxAuthCore(maxBytes, txBodyMaxBytes) {
    signal input txData[maxBytes];
    signal input senderEmailAddr[EMAIL_ADDR_MAX_BYTES()];
    
    signal input txBodyIdx;
    signal input emailSaltIdx;
    
    signal output emailCommitment;
    signal output txBodyHash;

    var numEmailAddrInts = computeIntChunkLength(EMAIL_ADDR_MAX_BYTES());
    var numTxBodyInts = computeIntChunkLength(txBodyMaxBytes);
    var saltMaxBytes = 31; // one field for the salt

    // extract tx body and email salt from tx data
    signal txRegexOut, txBodyReveal[maxBytes];
    signal emailSaltReveal[maxBytes];
    (txRegexOut, emailSaltReveal, txBodyReveal) <== TxBodyAndSaltRegex(maxBytes)(txData);
    signal emailSalt[saltMaxBytes];
    emailSalt <== SelectRegexReveal(maxBytes, saltMaxBytes)(emailSaltReveal, emailSaltIdx);
    signal txBody[txBodyMaxBytes];
    txBody <== SelectRegexReveal(maxBytes, txBodyMaxBytes)(txBodyReveal, txBodyIdx);

    // Expose email commitment
    signal senderEmailAddrInts[numEmailAddrInts] <== PackBytes(EMAIL_ADDR_MAX_BYTES())(senderEmailAddr);
    signal saltInts[1] <== PackBytes(saltMaxBytes)(emailSalt);
    emailCommitment <== EmailAddrCommit(numEmailAddrInts)(saltInts[0], senderEmailAddrInts);

    // Expose tx body commitment
    signal txBodyInts[numTxBodyInts] <== PackBytes(txBodyMaxBytes)(txBody);
    txBodyHash <== PoseidonModular(numTxBodyInts)(txBodyInts);
}