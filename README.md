# Tx Auth Email Wallet


## CLI Usage

### Compile Circuit
```sh
npx circomkit compile <circuit_name>

# print circuit info if you want to
npx circomkit info <circuit_name>
```

### Circuit Setup
Commence circuit-specific setup. Circomkit can determine the required PTAU and download it automatically when using `bn128` curve, thanks to [Perpetual Powers of Tau](https://github.com/privacy-scaling-explorations/perpetualpowersoftau).

```sh
npx circomkit setup <circuit_name>

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
You can create a proof using either rapidsnark or Circomkit.

#### Build rapidsnark for proving
```sh
git submodule update --init --recursive
cd rapidsnark
npm install
npx task createFieldSources
npx task buildProver
```

in case you run into any issues building the prover, refer to the [rapidsnark README](https://github.com/iden3/rapidsnark-old/blob/main/README.md) for more information. It is highly likely that you are missing to build tools such as `cmake` or `libgmp`.

and then run:

```sh
yarn prove:rapidsnark [circuit_name] [input_name]
```

example:
```sh
yarn prove:rapidsnark tx_auth_header_only default
```

#### Or generate proof with Circomkit
```sh
npx circomkit prove <circuit_name> default
```

### Verify Proof
We can then verify our proof. You can try and modify the public input at `./build/<circuit_name>/default/public.json` and see if the proof verifies or not!

```sh
npx circomkit verify <circuit_name> default
```

## Configuration

Circomkit checks for `circomkit.json` to override its default configurations. For example, to change the target version, prime field and the proof system:

```json
{
  "version": "2.1.2",
  "protocol": "plonk",
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
