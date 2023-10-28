import EnvelopeEffect from "../../effects/envelope";

const DEFAULT_VELOCITY = 1;
const DEFAULT_DURATION = 1;
const DEFAULT_FREQUENCY = 432 * 12;
const DEFAULT_OSCILLATOR_TYPE = 'square';

export default function OscillatorInstrument(audioContext, config = {}) {
    const destination = audioContext.destination;
    let lastDuration = DEFAULT_DURATION;
    let lastFrequency = DEFAULT_FREQUENCY
    let lastVelocity = DEFAULT_VELOCITY
    let activeOscillators = [];
    let envelope = EnvelopeEffect(audioContext, config.envelope || {
        attack: 200,
        // mixer: 0.5
    })
    return {
        playNote: function (frequency, startTime, duration, velocity) {
            // const gainNode = audioContext.createGain(); //to get smooth rise/fall
            if (duration) {
                lastDuration = duration;
            } else {
                duration = lastDuration
            }
            if (frequency) {
                lastFrequency = frequency;
            } else {
                frequency = lastFrequency
            }
            const endTime = startTime + duration;


            // Envelope
            const gainNode = envelope.createEnvelope(destination, startTime, velocity);

            const oscillator = createOscillator(config.type || DEFAULT_OSCILLATOR_TYPE, gainNode);
            oscillator.frequency.value = frequency;
            if (typeof config.detune === "undefined")
                oscillator.frequency.detune = config.detune;
            oscillator.start(startTime);
            oscillator.stop(endTime);
            activeOscillators.push(oscillator);

            // console.log("note start: ", {frequency, startTime, duration});
            oscillator.onended = () => {
                // console.log("note finished: ", {frequency, startTime, duration});
                const index = activeOscillators.indexOf(oscillator);
                if (index > 1)
                    activeOscillators.splice(index, 1);
            };
        },
        stopAllNotes: function () {
            for (const oscillator of activeOscillators) {
                oscillator.stop();
            }
            activeOscillators = [];
        }
    }

    function createOscillator(type, destination) {
        let source;
        switch (type) {
            case 'sine':
            case 'square':
            case 'sawtooth':
            case 'triangle':
                source = audioContext.createOscillator();
                source.type = type;
                // Connect Source
                source.connect(destination);
                return source;

            case 'pulse':
                return createPulseWaveShaper(destination)

            // case null:
            // case 'custom':
            //     source=audioContext.createOscillator();
            //
            //     // Load Sample
            //     const service = new PeriodicWaveLoader();
            //     let periodicWave = service.tryCache(this.config.url);
            //     if(periodicWave) {
            //         this.setPeriodicWave(source, periodicWave);
            //     } else {
            //         service.loadPeriodicWaveFromURL(this.config.url)
            //             .then(periodicWave => {
            //                 console.warn("Note playback started without an audio buffer: " + this.config.url);
            //                 this.setPeriodicWave(source, periodicWave);
            //             });
            //     }
            //     // Connect Source
            //     source.connect(destination);
            //     return source;

            default:
                throw new Error("Unknown oscillator type: " + type);
        }

    }

    function createPulseWaveShaper(destination) {
        const audioContext = destination.context;
        // Use a normal oscillator as the basis of our new oscillator.
        const source = audioContext.createOscillator();
        source.type = "sawtooth";

        const {pulseCurve, constantOneCurve} = getPulseCurve();
        // Use a normal oscillator as the basis of our new oscillator.

        // Shape the output into a pulse wave.
        const pulseShaper = audioContext.createWaveShaper();
        pulseShaper.curve = pulseCurve;
        source.connect(pulseShaper);

        // Use a GainNode as our new "width" audio parameter.

        const widthGain = audioContext.createGain();
        widthGain.gain.value = (typeof this.config.pulseWidth !== "undefined"
            ? this.config.pulseWidth
            : OscillatorInstrument.inputParameters.pulseWidth.default);

        source.width = widthGain.gain; //Add parameter to oscillator node.
        widthGain.connect(pulseShaper);

        // Pass a constant value of 1 into the widthGain – so the "width" setting
        // is duplicated to its output.
        const constantOneShaper = audioContext.createWaveShaper();
        constantOneShaper.curve = constantOneCurve;
        source.connect(constantOneShaper);
        constantOneShaper.connect(widthGain);

        pulseShaper.connect(destination);

        return source;
    }

}

