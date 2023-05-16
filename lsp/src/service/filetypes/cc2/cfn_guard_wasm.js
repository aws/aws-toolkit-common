let imports = {}
let wasm
const { TextEncoder, TextDecoder } = require(`util`)

let WASM_VECTOR_LEN = 0

let cachedUint8Memory0 = null

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer)
    }
    return cachedUint8Memory0
}

let cachedTextEncoder = new TextEncoder('utf-8')

const encodeString =
    typeof cachedTextEncoder.encodeInto === 'function'
        ? function (arg, view) {
              return cachedTextEncoder.encodeInto(arg, view)
          }
        : function (arg, view) {
              const buf = cachedTextEncoder.encode(arg)
              view.set(buf)
              return {
                  read: arg.length,
                  written: buf.length,
              }
          }

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg)
        const ptr = malloc(buf.length)
        getUint8Memory0()
            .subarray(ptr, ptr + buf.length)
            .set(buf)
        WASM_VECTOR_LEN = buf.length
        return ptr
    }

    let len = arg.length
    let ptr = malloc(len)

    const mem = getUint8Memory0()

    let offset = 0

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset)
        if (code > 0x7f) break
        mem[ptr + offset] = code
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset)
        }
        ptr = realloc(ptr, len, (len = offset + arg.length * 3))
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len)
        const ret = encodeString(arg, view)

        offset += ret.written
    }

    WASM_VECTOR_LEN = offset
    return ptr
}

let cachedInt32Memory0 = null

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer)
    }
    return cachedInt32Memory0
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true })

cachedTextDecoder.decode()

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len))
}
/**
 * @param {string} data
 * @param {string} rule
 * @returns {string}
 */
module.exports.cfn_guard_run_checks = function (data, rule) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
        const ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc)
        const len0 = WASM_VECTOR_LEN
        const ptr1 = passStringToWasm0(rule, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc)
        const len1 = WASM_VECTOR_LEN
        wasm.cfn_guard_run_checks(retptr, ptr0, len0, ptr1, len1)
        var r0 = getInt32Memory0()[retptr / 4 + 0]
        var r1 = getInt32Memory0()[retptr / 4 + 1]
        return getStringFromWasm0(r0, r1)
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16)
        wasm.__wbindgen_free(r0, r1)
    }
}

const path = require('path').join(__dirname, 'cfn_guard_wasm_bg.wasm')
const bytes = require('fs').readFileSync(path)

const wasmModule = new WebAssembly.Module(bytes)
const wasmInstance = new WebAssembly.Instance(wasmModule, imports)
wasm = wasmInstance.exports
module.exports.__wasm = wasm
