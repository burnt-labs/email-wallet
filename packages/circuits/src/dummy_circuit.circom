
pragma circom 2.1.5;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";


template DummyCircuit() {
    signal input in[2];
    signal output hash <== Poseidon(2)(in);
}

component main  = DummyCircuit();
