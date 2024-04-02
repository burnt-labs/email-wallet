pragma circom 2.1.5;

include "circomlib/circuits/poseidon.circom";
include "./slice.circom";

// running poseidon hash on the tx body
// the input data is devided into chunks of 16 ints and the hash is computed iteratively
template TxBodyCommit(num_tx_body_ints) {
    signal input tx_body_ints[num_tx_body_ints];
    signal output tx_body_hash; 

    var chunks = num_tx_body_ints \ 16;
    var last_chunk_size = num_tx_body_ints % 16;
    if (last_chunk_size != 0) {
        chunks += 1;
    }

    var _tx_body_hash;
    
    for (var i = 0; i < chunks; i++) {
        var start = i * 16;
        var end = start + 16;
        var chunk_hash;

        if (end > num_tx_body_ints) { // last chunk
            end = num_tx_body_ints;
            var last_chunk[last_chunk_size] = Slice(num_tx_body_ints, start, end)(tx_body_ints);
            chunk_hash = Poseidon(last_chunk_size)(last_chunk);
        } else {
            var chunk[16] = Slice(num_tx_body_ints, start, end)(tx_body_ints);
            chunk_hash = Poseidon(16)(chunk);
        }

        if (i == 0) {
            _tx_body_hash = chunk_hash;
        } else {
            _tx_body_hash = Poseidon(2)([_tx_body_hash, chunk_hash]);
        }
    }

    tx_body_hash <== _tx_body_hash;
}
