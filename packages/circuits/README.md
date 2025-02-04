# Tx Auth Email Wallet


## CLI Usage

### Install dependencies
```sh
yarn
```

### Compile Circuit
```sh
yarn compile <circuit_name>

# print circuit info if you want to
yarn circuit-info <circuit_name>
```

### Circuit Setup
Commence circuit-specific setup. Circomkit can determine the required PTAU and download it automatically when using `bn128` curve, thanks to [Perpetual Powers of Tau](https://github.com/privacy-scaling-explorations/perpetualpowersoftau).

```sh
yarn setup <circuit_name>

# alternative: provide the PTAU yourself
npx circomkit setup <circuit_name> <path-to-ptau>
```

### Prepare Input
Prepare your input file under `./inputs/<circuit_name>/default.json`.

or generate it:

example:
```sh
yarn gen -i default.eml -c tx_auth_header_only
```

### Create Proof
generate proof with Circomkit
```sh
yarn prove tx_auth_header_only default
```

### Verify Proof
We can then verify our proof. You can try and modify the public input at `./build/<circuit_name>/default/public.json` and see if the proof verifies or not!

```sh
yarn verify tx_auth_header_only default
```

## Configuration

Circomkit checks for `circomkit.json` to override its default configurations. For example, to change the target version, prime field and the proof system:

```json
{
  "version": "2.1.2",
  "protocol": "groth16",
  "prime": "bls12381"
}
```

## Testing

Use the following commands to test the circuits:

```sh
# test everything
yarn test

# test a specific circuit
yarn test -g <circuit-name>
```
