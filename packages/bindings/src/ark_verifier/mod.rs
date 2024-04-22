use ark_bn254::Bn254;
use ark_bn254::Config;
use ark_bn254::Fq2;
use ark_bn254::G1Affine;
use ark_bn254::G2Affine;
use ark_circom::read_zkey;
use ark_circom::CircomBuilder;
use ark_circom::CircomConfig;
use ark_circom::CircomReduction;
use ark_crypto_primitives::snark::SNARK;
use ark_ec::bn::Bn;
use ark_ff::MontFp;
use ark_groth16::Groth16;
use ark_groth16::Proof;
use ark_groth16::VerifyingKey;
use ark_serialize::CanonicalDeserialize;
use ark_serialize::CanonicalSerialize;
use ark_std::rand::thread_rng;
use std::fs;
type GrothBn = Groth16<Bn254, CircomReduction>;

pub fn generate_vkey_file_from_zkey(zkey_path: &str, vkey_path: &str) {
    let mut reader = std::fs::File::open(zkey_path).unwrap();
    let pk = read_zkey(&mut reader).unwrap().0;
    let writer: fs::File = fs::File::create(vkey_path).unwrap();
    pk.vk.serialize_compressed(writer).unwrap();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_verify_dummy_circuit_with_manual_proof() {
        generate_vkey_file_from_zkey("../circuits/build/dummy_circuit.zkey", "./vk.rvkey");

        // load verifying key from serialized file
        let vk = VerifyingKey::<Bn254>::deserialize_compressed(fs::File::open("vk.rvkey").unwrap())
            .unwrap();

        let proof = Proof::<Bn<Config>> {
            a: G1Affine {
                x: MontFp!("11294412146519031553958436620690294574137338159371573219103612735088119001708"),
                y: MontFp!("20689614565817130674840662886116830808078577756379655389251334604863586642302"),
                infinity: false,
            },
            b: G2Affine {
                x: Fq2::new(
                    MontFp!("14090670668082506356567908669402633523645960856268292184715574717045134884462"), 
                    MontFp!("13809028200529439189692614204327009468201202886018463205507531863944406244886")),
                y: Fq2::new(
                    MontFp!("14181719871816249308618454510645741605228437105978722289185291359307990899305"), 
                    MontFp!("16233906636351095081455735470865489090509958402647188982241771206117696810254")),
                infinity: false,
            },
            c: G1Affine {
                x: MontFp!("16872813123087290136331401509431187587498872180885111352743022972213042213939"),
                y: MontFp!("9029804859183623882677454770271326839865401779895123528544289580745575937268"),
                infinity: false,
            },
        };

        let public_inputs = vec![MontFp!(
            "7853200120776062878684798364095072458815029376092732009249414926327459813530"
        )];
        let verified = GrothBn::verify(&vk, &public_inputs, &proof).unwrap();
        assert!(verified);
    }

    #[test]
    fn test_verify_dummy_proof() {
        let cfg: CircomConfig<Bn254> = CircomConfig::<Bn254>::new(
            "../circuits/build/dummy_circuit/dummy_circuit_js/dummy_circuit.wasm",
            "../circuits/build/dummy_circuit/dummy_circuit.r1cs",
        )
        .unwrap();
        let mut builder = CircomBuilder::new(cfg);
        builder.push_input("in", 1);
        builder.push_input("in", 2);
        let circuit = builder.build().unwrap();
        let mut rng = thread_rng();
        let mut reader = std::fs::File::open("../circuits/build/dummy_circuit.zkey").unwrap();
        let pk = read_zkey(&mut reader).unwrap().0;
        let public_inputs = circuit.get_public_inputs().unwrap();
        let proof: Proof<Bn<Config>> =
            GrothBn::create_random_proof_with_reduction(circuit, &pk, &mut rng).unwrap();
        let verified = GrothBn::verify(&pk.vk, &public_inputs, &proof).unwrap();
        let writer: fs::File = fs::File::create("vk").unwrap();
        assert!(verified);
    }
}
