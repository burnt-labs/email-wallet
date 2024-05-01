#[cfg(test)]
mod tests {
    use ark_crypto_primitives::snark::SNARK;
    use utils::{
        ark_verifier::{GrothBn, GrothBnProof, GrothBnVkey, JsonDecoder, PublicInputs},
        commit::{calculate_email_commitment, calculate_tx_body_commitment},
    };

    #[test]
    fn should_verify_body_proof() {
        assert_verification(
            "tests/data/body/vkey.json",
            "tests/data/body/proof.json",
            "tests/data/body/public.json",
        );
    }

    #[test]
    fn should_verify_header_proof() {
        assert_verification(
            "tests/data/header/vkey.json",
            "tests/data/header/proof.json",
            "tests/data/header/public.json",
        );
    }

    fn assert_verification(
        vkey_json_path: &str,
        proof_json_path: &str,
        public_inputs_json_path: &str,
    ) {
        const salt: &str = "XRhMS5Nc2dTZW5kEpAB";
        const email: &str = "thezdev1@gmail.com";
        const tx: &str = "CrQBCrEBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEpABCj94aW9uMWd2cDl5djZndDBwcmdzc3\
        ZueWNudXpnZWszZmtyeGxsZnhxaG0wNzYwMmt4Zmc4dXI2NHNuMnAycDkSP3hpb24xNGNuMG40ZjM4ODJzZ3B2NWQ5ZzA2dzNxN3hzZ\
        m51N3B1enltZDk5ZTM3ZHAwemQ4bTZscXpwemwwbRoMCgV1eGlvbhIDMTAwEmEKTQpDCh0vYWJzdHJhY3RhY2NvdW50LnYxLk5pbFB1\
        YktleRIiCiBDAlIzSFvCNEIMmTE+CRm0U2Gb/0mBfb/aeqxkoPweqxIECgIIARh/EhAKCgoFdXhpb24SATAQwJoMGg54aW9uLXRlc3R\
        uZXQtMSCLjAo=";

        let vkey = GrothBnVkey::from_json_file(vkey_json_path);
        let proof = GrothBnProof::from_json_file(proof_json_path);
        let public_inputs: PublicInputs<3> = PublicInputs::from_json_file(public_inputs_json_path);
        let verified = GrothBn::verify(&vkey, &public_inputs, &proof).unwrap();
        let email_commitment = calculate_email_commitment(salt, email);
        let tx_body_commitment = calculate_tx_body_commitment(tx);

        assert!(verified);
        assert_eq!(public_inputs[0], tx_body_commitment);
        assert_eq!(public_inputs[1], email_commitment);
    }
}
