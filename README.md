# Email Wallet Monorepo

This is a monorepo for the Email Wallet project, which includes several components:

- Circuits
- Utils
- Relayer
- Prover

## Components

### Circuits
Contains the zero-knowledge circuits used in the Email Wallet system.

### Utils
Utility functions and helper modules for the project.

### Relayer
The relayer component of the Email Wallet system.

### Prover
A fast prover implementation for generating zkSNARK proofs.

## Getting Started

To build the prover, run the following command:

```sh
yarn build:prover
```


## Building rapidsnark with GPU support

You'll need NVIDIA GPU drivers and CUDA toolkit installed. Following is for debian based systems. 

Note: docekr desktop on Linux and Mac does not support GPU passthrough. You'll need to use docker engine on Linux for GPU passthrough.

```sh
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
```


```
prover_cuda tx_auth/groth16_pkey.zkey tx_auth/default/witness.wtns tx_auth/gproof.json tx_auth/gpublic.json
prover_cuda tx_auth_header_only/groth16_pkey.zkey tx_auth_header_only/default/witness.wtns tx_auth_header_only/gproof.json tx_auth_header_only/gpublic.json
```
