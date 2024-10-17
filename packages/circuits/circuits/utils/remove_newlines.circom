pragma circom 2.1.5;

template RemoveNewLines(max_line_bytes, max_lines) {
    signal input in[max_line_bytes * max_lines];
    signal output out[(max_line_bytes - 2) * max_lines]; // -2 to ignore \r\n
    for (var i = 0 ; i < max_lines; i++) {
        for (var j = 0 ; j < max_line_bytes - 2; j++){
            out[i * (max_line_bytes - 2) + j] <== in[i * max_line_bytes + j];
        }
    }
}