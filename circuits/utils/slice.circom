pragma circom 2.1.5;

// Slices a given signal from start to end returning the sliced signal
template Slice(n, start, end) {
    assert(n >= end);
    assert(start >= 0);
    assert(end >= start);

    signal input in[n];
    signal output out[end - start];    

    for (var i = start; i < end; i++) {
        out[i - start] <== in[i];
    }
}