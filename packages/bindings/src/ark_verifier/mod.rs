use ark_bn254::Bn254;
use ark_bn254::Config;
use ark_bn254::Fq2;
use ark_bn254::G1Affine;
use ark_bn254::G2Affine;
use ark_circom::ethereum::G1;
use ark_circom::ethereum::G2;
use ark_circom::read_zkey;
use ark_circom::CircomBuilder;
use ark_circom::CircomConfig;
use ark_circom::CircomReduction;
use ark_crypto_primitives::snark::SNARK;
use ark_ec::bn::Bn;
use ark_ff::Fp;
use ark_ff::MontFp;
use ark_groth16::Groth16;
use ark_groth16::Proof;
use ark_groth16::VerifyingKey;
use ark_serialize::CanonicalDeserialize;
use ark_serialize::CanonicalSerialize;
use ark_std::rand::thread_rng;
use std::fs;
use std::str::FromStr;
type GrothBn = Groth16<Bn254, CircomReduction>;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct SnarkJsProof {
    pi_a: [String; 3],
    pi_b: [[String; 2]; 3],
    pi_c: [String; 3],
}

#[derive(Debug, Deserialize)]
struct SnarkJsVkey {
    vk_alpha_1: [String; 3],
    vk_beta_2: [[String; 2]; 3],
    vk_gamma_2: [[String; 2]; 3],
    vk_delta_2: [[String; 2]; 3],
    IC: Vec<[String; 3]>,
}

trait JsonDecoder {
    fn from_json(json: &str) -> Self;
    fn from_json_file(file_path: &str) -> Self
    where
        Self: Sized,
    {
        let json = fs::read_to_string(file_path).unwrap();
        Self::from_json(&json)
    }
}

impl JsonDecoder for Proof<Bn<Config>> {
    fn from_json(json: &str) -> Self {
        let snarkjs_proof: SnarkJsProof = serde_json::from_str(json).unwrap();
        let a = G1Affine {
            x: Fp::from_str(snarkjs_proof.pi_a[0].as_str()).unwrap(),
            y: Fp::from_str(snarkjs_proof.pi_a[1].as_str()).unwrap(),
            infinity: false,
        };
        let b = G2Affine {
            x: Fq2::new(
                Fp::from_str(snarkjs_proof.pi_b[0][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_proof.pi_b[0][1].as_str()).unwrap(),
            ),
            y: Fq2::new(
                Fp::from_str(snarkjs_proof.pi_b[1][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_proof.pi_b[1][1].as_str()).unwrap(),
            ),
            infinity: false,
        };
        let c = G1Affine {
            x: Fp::from_str(snarkjs_proof.pi_c[0].as_str()).unwrap(),
            y: Fp::from_str(snarkjs_proof.pi_c[1].as_str()).unwrap(),
            infinity: false,
        };
        Proof { a, b, c }
    }
}

impl JsonDecoder for VerifyingKey<Bn254> {
    fn from_json(json: &str) -> Self {
        let snarkjs_vkey: SnarkJsVkey = serde_json::from_str(json).unwrap();
        let vk_alpha_1 = G1Affine {
            x: Fp::from_str(snarkjs_vkey.vk_alpha_1[0].as_str()).unwrap(),
            y: Fp::from_str(snarkjs_vkey.vk_alpha_1[1].as_str()).unwrap(),
            infinity: false,
        };
        let vk_beta_2 = G2Affine {
            x: Fq2::new(
                Fp::from_str(snarkjs_vkey.vk_beta_2[0][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_vkey.vk_beta_2[0][1].as_str()).unwrap(),
            ),
            y: Fq2::new(
                Fp::from_str(snarkjs_vkey.vk_beta_2[1][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_vkey.vk_beta_2[1][1].as_str()).unwrap(),
            ),
            infinity: false,
        };
        let vk_gamma_2 = G2Affine {
            x: Fq2::new(
                Fp::from_str(snarkjs_vkey.vk_gamma_2[0][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_vkey.vk_gamma_2[0][1].as_str()).unwrap(),
            ),
            y: Fq2::new(
                Fp::from_str(snarkjs_vkey.vk_gamma_2[1][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_vkey.vk_gamma_2[1][1].as_str()).unwrap(),
            ),
            infinity: false,
        };
        let vk_delta_2 = G2Affine {
            x: Fq2::new(
                Fp::from_str(snarkjs_vkey.vk_delta_2[0][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_vkey.vk_delta_2[0][1].as_str()).unwrap(),
            ),
            y: Fq2::new(
                Fp::from_str(snarkjs_vkey.vk_delta_2[1][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_vkey.vk_delta_2[1][1].as_str()).unwrap(),
            ),
            infinity: false,
        };

        let ic = snarkjs_vkey
            .IC
            .iter()
            .map(|ic| G1Affine {
                x: Fp::from_str(ic[0].as_str()).unwrap(),
                y: Fp::from_str(ic[1].as_str()).unwrap(),
                infinity: false,
            })
            .collect();

        VerifyingKey {
            alpha_g1: vk_alpha_1,
            beta_g2: vk_beta_2,
            gamma_g2: vk_gamma_2,
            delta_g2: vk_delta_2,
            gamma_abc_g1: ic,
        }
    }
}

pub fn generate_vkey_file_from_zkey(zkey_path: &str, vkey_path: &str) {
    let mut reader = std::fs::File::open(zkey_path).unwrap();
    let pk = read_zkey(&mut reader).unwrap().0;
    let writer: fs::File = fs::File::create(vkey_path).unwrap();
    pk.vk.serialize_compressed(writer).unwrap();
}

#[cfg(test)]
mod tests {
    use ark_bn254::FrConfig;
    use ark_ff::MontBackend;

    use super::*;

    #[test]
    fn should_load_vkey() {
        let vkey: VerifyingKey<Bn254> =
            VerifyingKey::from_json_file("../circuits/build/tx_auth.vkey");

        println!("{:?}", vkey);
    }

    #[test]
    fn verify_tx_auth_email_proof() {
        let vkey: VerifyingKey<Bn254> =
            VerifyingKey::from_json_file("../circuits/build/tx_auth.vkey");

        // load proof from json file
        let proof: Proof<Bn<Config>> =
            Proof::<Bn<Config>>::from_json_file("../circuits/build/tx_auth_proof.json");

        // public inputs
        let public_inputs = [
            "21532090391056315603450239923154193952164369422267200983793686866358632420524",
            "20222897760242655042591071331570003228637614099423116142933693104079157558229",
            "6632353713085157925504008443078919716322386156160602218536961028046468237192",
        ];
        let public_inputs: Vec<Fp<MontBackend<FrConfig, 4>, 4>> = public_inputs
            .iter()
            .map(|input| Fp::from_str(input).unwrap())
            .collect();

        let verified = GrothBn::verify(&vkey, &public_inputs, &proof).unwrap();
        assert!(verified);
    }

    #[test]
    fn should_deserialize_proof_from_json() {
        let raw_json_proof = r#"
        {
            "pi_a": [
              "11294412146519031553958436620690294574137338159371573219103612735088119001708",
              "20689614565817130674840662886116830808078577756379655389251334604863586642302",
              "1"
            ],
            "pi_b": [
              [
                "14090670668082506356567908669402633523645960856268292184715574717045134884462",
                "13809028200529439189692614204327009468201202886018463205507531863944406244886"
              ],
              [
                "14181719871816249308618454510645741605228437105978722289185291359307990899305",
                "16233906636351095081455735470865489090509958402647188982241771206117696810254"
              ],
              [
                "1",
                "0"
              ]
            ],
            "pi_c": [
              "16872813123087290136331401509431187587498872180885111352743022972213042213939",
              "9029804859183623882677454770271326839865401779895123528544289580745575937268",
              "1"
            ],
            "protocol": "groth16",
            "curve": "bn128"
          }"#;

        Proof::<Bn<Config>>::from_json(raw_json_proof);
    }

    #[test]
    fn verify_dummy_circuit_with_json_file() {
        generate_vkey_file_from_zkey("../circuits/build/dummy_circuit.zkey", "./vk.rvkey");

        // load verifying key from serialized file
        let vk = VerifyingKey::<Bn254>::deserialize_compressed(fs::File::open("vk.rvkey").unwrap())
            .unwrap();

        let proof: Proof<Bn<Config>> =
            Proof::<Bn<Config>>::from_json_file("../circuits/build/dummy_circuit_proof.json");

        let public_inputs = vec![MontFp!(
            "7853200120776062878684798364095072458815029376092732009249414926327459813530"
        )];
        let verified = GrothBn::verify(&vk, &public_inputs, &proof).unwrap();
        assert!(verified);
    }

    #[test]
    fn verify_dummy_circuit_with_json_proof() {
        generate_vkey_file_from_zkey("../circuits/build/dummy_circuit.zkey", "./vk.rvkey");

        // load verifying key from serialized file
        let vk = VerifyingKey::<Bn254>::deserialize_compressed(fs::File::open("vk.rvkey").unwrap())
            .unwrap();

        let raw_json_proof = r#"
        {
            "pi_a": [
              "11294412146519031553958436620690294574137338159371573219103612735088119001708",
              "20689614565817130674840662886116830808078577756379655389251334604863586642302",
              "1"
            ],
            "pi_b": [
              [
                "14090670668082506356567908669402633523645960856268292184715574717045134884462",
                "13809028200529439189692614204327009468201202886018463205507531863944406244886"
              ],
              [
                "14181719871816249308618454510645741605228437105978722289185291359307990899305",
                "16233906636351095081455735470865489090509958402647188982241771206117696810254"
              ],
              [
                "1",
                "0"
              ]
            ],
            "pi_c": [
              "16872813123087290136331401509431187587498872180885111352743022972213042213939",
              "9029804859183623882677454770271326839865401779895123528544289580745575937268",
              "1"
            ],
            "protocol": "groth16",
            "curve": "bn128"
          }"#;

        let proof: Proof<Bn<Config>> = Proof::<Bn<Config>>::from_json(raw_json_proof);

        let public_inputs = vec![MontFp!(
            "7853200120776062878684798364095072458815029376092732009249414926327459813530"
        )];
        let verified = GrothBn::verify(&vk, &public_inputs, &proof).unwrap();
        assert!(verified);
    }

    #[test]
    fn verify_dummy_circuit_with_manual_proof() {
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
    fn prove_and_verify_dummy_circuit() {
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
        assert!(verified);
    }
}
