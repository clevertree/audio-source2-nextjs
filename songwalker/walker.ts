import {parseFrequencyString} from "./note";
import constants from "./constants"
import {compileSongToCallback} from "@songwalker/compiler";
import {
    HandlesTrackEvents,
    SongError,
    SongHandler,
    SongState,
    SongTrackEvent,
    TrackHandler,
    TrackState
} from "@songwalker/types";

const BUFFER_DURATION = .1;
// const START_DELAY = .1;
const DEFAULT_BPM = 60;
const DEFAULT_NOTE_DURATION = 1;
const DEFAULT_NOTE_VELOCITY = 1;


export class DurationEvent implements SongTrackEvent {
    destination: AudioDestinationNode;
    startTime: number;
    duration: number;

    constructor(destination: AudioDestinationNode, startTime: number, duration: number) {
        this.destination = destination;
        this.startTime = startTime;
        this.duration = duration;
    }

    async waitForEventStart() {
        let delayUntilStart = this.startTime - this.destination.context.currentTime;
        if (delayUntilStart > 0)
            await new Promise((resolve) => {
                setTimeout(resolve, delayUntilStart > 0 ? delayUntilStart * 1000 : 0)
            })
    }

    async waitForEventEnd() {
        let delayUntilEnd = this.startTime - this.destination.context.currentTime + this.duration;
        if (delayUntilEnd > 0)
            await new Promise((resolve) => {
                setTimeout(resolve, delayUntilEnd > 0 ? delayUntilEnd * 1000 : 0)
            })
    }
}

export class PlayNoteEvent extends DurationEvent {
    frequency: number;
    velocity: number;
    handler?: NoteHandler;

    constructor(destination: AudioDestinationNode, frequency: number, startTime: number, duration: number, velocity: number) {
        super(destination, startTime, duration)
        this.frequency = frequency;
        this.velocity = velocity;
    }
}

export class LoadInstrumentEvent implements SongTrackEvent {
    promise: Promise<InstrumentInstance> | InstrumentInstance;
    loader: InstrumentLoader;

    constructor(loader: InstrumentLoader, promise: Promise<InstrumentInstance> | InstrumentInstance) {
        this.loader = loader
        this.promise = promise;
    }

    async waitForEventStart() {
    }

    async waitForEventEnd() {
        await this.promise;
    }
}

export class SetVariableEvent implements SongTrackEvent {
    path: string;
    value: any;

    constructor(variablePath: string, variableValue: any) {
        this.path = variablePath;
        this.value = variableValue;
    }

    async waitForEventStart() {
    }

    async waitForEventEnd() {
        await new Promise((resolve) => {
            setTimeout(resolve, 1000)
        })
    }
}

export class StartTrackEvent implements SongTrackEvent {
    trackHandler: TrackHandler;

    constructor(subTrackHandler: TrackHandler) {
        this.trackHandler = subTrackHandler;
    }

    async waitForEventStart() {
    }

    async waitForEventEnd() {
        await this.trackHandler.waitForTrackToFinish()
    }
}


export type InstrumentBank = {
    [instrumentPath: string]: InstrumentLoader
}

export interface NoteHandler {
    onended: ((this: any, ev: Event) => any) | null;

    stop(when?: number): void;
}

export type InstrumentInstance = (noteEvent: PlayNoteEvent) => NoteHandler;

export type InstrumentLoader = (config: object) => Promise<InstrumentInstance> | InstrumentInstance
export type TrackRenderer = {
    trackState: TrackState,
    playNote: (frequencyString: string, duration?: number, velocity?: number) => void;
    loadInstrument: (instrumentLoader: InstrumentLoader, config?: object) => Promise<InstrumentInstance>;
    setVariable: (variablePath: string, variableValue: any) => void;
    // getVariable: (variablePath: string) => any;
    startTrack: (trackCallback: TrackCallback) => void;
    wait: (duration: number) => Promise<void>;
    setCurrentToken: (tokenID: number) => void;
    // setCurrentInstrument: (instrument:Instrument) => void
    // promise: Promise<void> | null
}

export type TrackCallback = (trackRenderer: TrackRenderer) => Promise<void> | void;


export function compileToSongPlayer(songSource: string, trackEventHandler: HandlesTrackEvents) {
    const callback = compileSongToCallback(songSource)
    return getSongPlayer(callback, trackEventHandler);
}


export function getSongPlayer(
    songCallback: TrackCallback,
    trackEventHandler: HandlesTrackEvents
) {
    const audioContext = new AudioContext();
    let trackState = {
        destination: audioContext.destination,
        instrument: UnassignedInstrument,
        // startTime: audioContext.currentTime,
        currentTime: audioContext.currentTime,
        position: 0,
        noteDuration: DEFAULT_NOTE_DURATION,
        noteVelocity: DEFAULT_NOTE_VELOCITY,
        beatsPerMinute: DEFAULT_BPM,
        bufferDuration: BUFFER_DURATION
    }
    const songState: SongState = {
        isPlaying: true
    }
    let trackHandler: TrackHandler;
    const songHandler: SongHandler = {
        startPlayback() {
            trackHandler = walkTrack(songCallback, trackState, songState, trackEventHandler);
            return trackHandler
        },
        stopPlayback(): void {
            songState.isPlaying = false;
        },
        async waitForSongToFinish(): Promise<void> {
            if (!trackHandler)
                throw new Error("Song has not been started yet");
            await trackHandler.waitForTrackToFinish();
        },
        // addEventCallback: function (trackName: string, callback: TrackEventHandler) {
        //     if (!songState.trackEventHandlers[trackName])
        //         songState.trackEventHandlers[trackName] = [];
        //     songState.trackEventHandlers[trackName].push(callback)
        // },
        getRootTrackState: function () {
            return trackState;
        }
    }
    return songHandler
}


// TODO: track args
export function walkTrack(
    trackCallback: TrackCallback,
    trackState: TrackState,
    songState: SongState,
    trackEventHandler: HandlesTrackEvents) {
    const trackName = trackCallback.name;
    const subTrackHandlers: TrackHandler[] = [];

    function handleTrackEvent(trackEvent: SongTrackEvent) {
        trackEventHandler.handleTrackEvent(trackName, trackEvent, trackState.currentTokenID)
    }

    const trackRenderer: TrackRenderer = {
        trackState,
        async loadInstrument(instrumentLoader: InstrumentLoader, config: object | undefined): Promise<InstrumentInstance> {
            if (!songState.isPlaying)
                throw Error("Playback has ended");
            const promise = instrumentLoader(config || {});
            trackState.instrument = await promise;
            return trackState.instrument;
        },
        playNote(frequencyString: string, duration?: number, velocity?: number): void {
            if (!songState.isPlaying)
                return;
            if (typeof duration === 'undefined') {
                duration = trackState.noteDuration;
                // } else {
                //     trackState.noteDuration = duration;
            }
            if (typeof velocity === 'undefined') {
                velocity = trackState.noteVelocity;
                // } else {
                //     trackState.noteVelocity = velocity;
            }
            const startTime = trackState.currentTime; //  + trackState.position;
            const durationWithBPM = duration * (60 / trackState.beatsPerMinute)
            const frequency = parseFrequencyString(frequencyString);
            const noteEvent = new PlayNoteEvent(
                trackState.destination,
                frequency,
                startTime,
                durationWithBPM,
                velocity
            )        // if (typeof duration === "string")
            //     duration = parseDurationString(duration, trackBPM);
            // console.log("noteEvent", noteEvent)
            noteEvent.handler = trackState.instrument(noteEvent);
            handleTrackEvent(noteEvent);
        },
        setVariable(variablePath: string, variableValue: any): void {
            trackState[variablePath] = variableValue;
            handleTrackEvent(new SetVariableEvent(variablePath, variableValue));
        },

        startTrack(trackCallback: TrackCallback): void {
            const subTrackState: TrackState = {
                ...trackState,
                position: 0,
            }
            const subTrackHandler = walkTrack(trackCallback, subTrackState, songState, trackEventHandler)
            subTrackHandlers.push(subTrackHandler);
            handleTrackEvent(new StartTrackEvent(subTrackHandler));
        },
        async wait(duration: number): Promise<void> {
            if (!songState.isPlaying)
                return;
            const durationWithBPM = duration * (60 / trackState.beatsPerMinute)
            const currentTime = trackState.currentTime;
            const waitTime = ((currentTime + durationWithBPM) - trackState.destination.context.currentTime) - trackState.bufferDuration;
            if (waitTime > 0) {
                // console.log(`Waiting ${waitTime}s`, trackState.currentTime, trackState.destination.context.currentTime, durationWithBPM);
                handleTrackEvent(new DurationEvent(trackState.destination, currentTime, durationWithBPM));
                await new Promise(resolve => setTimeout(resolve, waitTime * 1000));

            } else {
                // console.log(`Not Waiting ${waitTime}s`, trackState.currentTime, trackState.destination.context.currentTime, durationWithBPM);

            }
            trackState.position += duration;
            trackState.currentTime += durationWithBPM;
        },
        setCurrentToken(tokenID: number) {
            trackState.currentTokenID = tokenID
        },
    }

    const trackPromise = trackCallback(trackRenderer)
    const trackHandler: TrackHandler = {
        async waitForTrackToFinish(): Promise<void> {
            try {
                await trackPromise;
                await Promise.all(subTrackHandlers.map(handler => handler.waitForTrackToFinish()))
                // for (const subTrackHandler of subTrackHandlers) {
                //     await subTrackHandler.waitForTrackToFinish();
                // }
                const waitTime = ((trackState.currentTime) - trackState.destination.context.currentTime);
                console.log('waitForTrackToFinish', waitTime, trackState.destination.context.currentTime, trackState.currentTime)
                if (waitTime > 0) {
                    console.log(`Waiting for track to end ${waitTime}s`);
                    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                }
            } catch (e) {
                if (typeof (e as SongError).trackName !== "undefined")
                    throw e;
                throw {
                    message: (e as Error).message,
                    trackName,
                    tokenID: trackState.currentTokenID
                };
            }
        },
        getTrackName() {
            return trackName
        },
        getTrackState() {
            return trackState;
        }
    }
    return trackHandler;
}


export function getRequireCallback(instruments: InstrumentBank) {
    return function require(path: string) {
        if (instruments[path])
            return instruments[path];
        throw new Error("Instrument not found: " + path);
    }
}

const UnassignedInstrument: InstrumentInstance = (noteEvent: PlayNoteEvent) => {
    throw new Error(constants.ERR_NO_INSTRUMENT);
}
