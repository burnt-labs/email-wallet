#[cfg(test)]
mod tests {
    use std::fs;

    use ark_bn254::Bn254;
    use ark_circom::read_zkey;
    use ark_circom::CircomBuilder;
    use ark_circom::CircomConfig;
    use ark_circom::CircomReduction;
    use ark_crypto_primitives::snark::SNARK;
    use ark_groth16::Groth16;
    use ark_groth16::VerifyingKey;
    use ark_serialize::CanonicalDeserialize;
    use ark_serialize::CanonicalSerialize;
    use ark_std::rand::thread_rng;
    type GrothBn = Groth16<Bn254, CircomReduction>;

    #[test]
    fn test_dummy_circuit_prover() {
        let cfg: CircomConfig<Bn254> = CircomConfig::<Bn254>::new(
            "../circuits/build/dummy_circuit/dummy_circuit_js/dummy_circuit.wasm",
            "../circuits/build/dummy_circuit/dummy_circuit.r1cs",
        )
        .unwrap();

        let mut builder = CircomBuilder::new(cfg);
        builder.push_input("in", 1);
        builder.push_input("in", 2);

        let vk =
            VerifyingKey::<Bn254>::deserialize_compressed(fs::File::open("vk").unwrap()).unwrap();
        let circuit = builder.build().unwrap();
        let mut rng = thread_rng();
        let mut reader = std::fs::File::open("../circuits/build/dummy_circuit.zkey").unwrap();
        let pk = read_zkey(&mut reader).unwrap().0;
        let public_inputs = circuit.get_public_inputs().unwrap();
        let proof = GrothBn::create_random_proof_with_reduction(circuit, &pk, &mut rng).unwrap();
        let verified = GrothBn::verify(&vk, &public_inputs, &proof).unwrap();

        let writer: fs::File = fs::File::create("vk").unwrap();
        pk.vk.serialize_compressed(writer).unwrap();

        assert!(verified);
    }
}
