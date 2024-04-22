mod ark_verifier;
use clap::Parser;

/// CLI to generate ark-circom compatible verification keys from zkey files.
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// snarkjs zkey file path
    #[arg(short, long)]
    zkey: String,

    /// output file path for the verification key
    #[arg(short, long, default_value = "./vk.rvkey")]
    rvkey: String,
}

fn main() {
    let args = Args::parse();
    ark_verifier::generate_vkey_file_from_zkey(&args.zkey, &args.rvkey);
}
