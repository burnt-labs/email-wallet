use crate::ark_verifier::GrothFp;
use ark_ff::*;

const EMAIL_MAX_BYTES: usize = 256;

pub fn calculate_email_commitment(salt: &str, email: &str) -> GrothFp {
    let padded_salt_bytes = pad_bytes(salt.as_bytes(), 31);
    let padded_email_bytes = pad_bytes(email.as_bytes(), EMAIL_MAX_BYTES);

    let mut salt = pack_bytes_into_fields(padded_salt_bytes);
    let email = pack_bytes_into_fields(padded_email_bytes);
    salt.extend(email);

    let poseidon = poseidon_ark::Poseidon::new();
    poseidon.hash(salt).unwrap()
}

fn pack_bytes_into_fields(bytes: Vec<u8>) -> Vec<GrothFp> {
    // convert each 31 bytes into one field element

    let mut fields = vec![];
    bytes.chunks(31).for_each(|chunk| {
        fields.push(GrothFp::from_le_bytes_mod_order(&chunk));
    });
    fields
}

fn pad_bytes(bytes: &[u8], length: usize) -> Vec<u8> {
    let mut padded = bytes.to_vec();
    let padding = length - bytes.len();
    for _ in 0..padding {
        padded.push(0);
    }
    padded
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn should_calculate_email_commitment() {
        let salt_str = "XRhMS5Nc2dTZW5kEpAB";
        let email_str = "thezdev1@gmail.com";

        let commitment = calculate_email_commitment(&salt_str, &email_str);

        assert_eq!(
            commitment,
            Fp::from_str(
                "20222897760242655042591071331570003228637614099423116142933693104079157558229"
            )
            .unwrap()
        );
    }
}
