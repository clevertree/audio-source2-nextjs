import {startTrack} from "./songPlayer";
import Instrument from "../song/instruments/oscillator";

let testInstrumentInstance, testSongInstance;
describe('songPlayer', () => {
    beforeEach(() => {
        testInstrumentInstance = {
            playNote: cy.stub()
        }

        testSongInstance = {
            playing: true,
            startTime: 0,
            activeInstruments: [],
            stopPlayback: cy.stub(),
            audioContext: new AudioContext()
        }
    })

    it('plays a song', async () => {
        const songInstance = startTrack(testTrack, 0, 0, 60, testInstrumentInstance, testSongInstance);
        await songInstance.waitForTrackFinish();
        expect(testInstrumentInstance.playNote.callCount).to.eq(9)
    })

    it('plays sub-tracks', async () => {
        const songInstance = startTrack(testSong, 0, 0, 60, testInstrumentInstance, testSongInstance);
        await songInstance.waitForTrackFinish();
        const status = songInstance.getTrackStatus();
        expect(testInstrumentInstance.playNote.callCount).to.eq(18)
        expect(status.position).to.eq(16)
        expect(status.currentTime).to.eq(12)
    })

})


async function testSong(track) {
    const {playNote: n, wait: w} = track;

    track.setBeatsPerMinute(120)
    track.startTrack(testTrack)
    await w(8);
    track.setBeatsPerMinute(60)
    track.startTrack(testTrack)
    await w(8);
}

async function testTrack(track) {
    const {playNote: n, wait: w} = track;

    track.setBeatsPerMinute(120)

    n("C5", (1 / 4) * 1.5);
    await w(1 / 4);
    n("C4", 1 / 4);
    await w(1 / 4);
    n("G4", 1 / 5);
    await w(1 / 4);
    n("Eb4", 1 / 4);
    await w(1 / 4);
    n("Eb5", (1 / 4) / 1.5);
    await w(1 / 4);
    n("F5", (1 / 4) / 1.5);
    await w(1 / 4);
    n("Eb5", (1 / 4) / 1.5);
    await w(1 / 4);
    n("D5", (1 / 4) / 1.5);
    await w(1 / 4);
    n("C5", (1 / 4) * 1.5);
}