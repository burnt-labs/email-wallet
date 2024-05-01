#[cfg(test)]
mod tests {
    use ark_crypto_primitives::snark::SNARK;
    use utils::ark_verifier::{GrothBn, GrothBnProof, GrothBnVkey, JsonDecoder, PublicInputs};

    #[test]
    fn should_verify_body_proof() {
        let vkey_json_path = "tests/data/body/vkey.json";
        let proof_json_path = "tests/data/body/proof.json";
        let public_inputs_json_path = "tests/data/body/public.json";

        let vkey = GrothBnVkey::from_json_file(&vkey_json_path);
        let proof = GrothBnProof::from_json_file(&proof_json_path);
        let public_inputs: PublicInputs<3> = PublicInputs::from_json_file(&public_inputs_json_path);

        let verified = GrothBn::verify(&vkey, &public_inputs, &proof).unwrap();
        assert!(verified);
    }

    #[test]
    fn should_verify_header_proof() {
        let vkey_json_path = "tests/data/header/vkey.json";
        let proof_json_path = "tests/data/header/proof.json";
        let public_inputs_json_path = "tests/data/header/public.json";

        let vkey = GrothBnVkey::from_json_file(&vkey_json_path);
        let proof = GrothBnProof::from_json_file(&proof_json_path);
        let public_inputs: PublicInputs<3> = PublicInputs::from_json_file(&public_inputs_json_path);

        let verified = GrothBn::verify(&vkey, &public_inputs, &proof).unwrap();
        assert!(verified);
    }
}
