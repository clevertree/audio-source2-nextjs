import Instrument from "./instruments/oscillator"

export default async ({p, i, w, bpm}) => {
    i(Instrument, "{arg: 1}")
    bpm(160)
    p("E4", "1B")
    await w("1B")
    p("E4")
    await w("1B")
    p("A#4")
    p("C4")
    await w("1B")
    p("B4")
    p("D5")
    await w("2B")
    p("C7", "1T")
    await w("1T")
    p("C6")
    await w("1T")
    p("C5")
    await w("1T")
    p("C4")
    await w("1T")
    p("C3")
    await w("1T")
}