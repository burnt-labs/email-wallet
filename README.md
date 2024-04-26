# Tx Auth Email Wallet


## CLI Usage

```sh
npx circomkit compile <circuit_name>

# print circuit info if you want to
npx circomkit info <circuit_name>
```

3. Commence circuit-specific setup. Normally, this requires us to download a Phase-1 PTAU file and provide it's path; however, Circomkit can determine the required PTAU and download it automatically when using `bn128` curve, thanks to [Perpetual Powers of Tau](https://github.com/privacy-scaling-explorations/perpetualpowersoftau). In this case, `sudoku_9x9` circuit has 4617 constraints, so Circomkit will download `powersOfTau28_hez_final_13.ptau` (see [here](https://github.com/iden3/snarkjs#7-prepare-phase-2)).

```sh
npx circomkit setup <circuit_name>

# alternative: provide the PTAU yourself
npx circomkit setup <circuit_name> <path-to-ptau>
```

4. Prepare your input file under `./inputs/<circuit_name>/default.json`.

5. We are ready to create a proof!

```sh
npx circomkit prove <circuit_name> default
```

6. We can then verify our proof. You can try and modify the public input at `./build/<circuit_name>/default/public.json` and see if the proof verifies or not!

```sh
npx circomkit verify <circuit_name> default
```


## Configuration

Circomkit checks for `circomkit.json` to override it's default configurations. We could for example change the target version, prime field and the proof system by setting `circomkit.json` to be:

```json
{
  "version": "2.1.2",
  "protocol": "plonk",
  "prime": "bls12381"
}
```

## Testing

You can use the following commands to test the circuits:

```sh
# test everything
yarn test

# test a specific circuit
yarn test -g <circuit-name>
```
