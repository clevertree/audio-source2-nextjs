const songSource = `
lead=loadInstrument("oscillator", {'type': 'sine'})
lead2=loadInstrument("oscillator", {'type':'triangle'})

instrument=lead
@track1 3/8 
instrument=lead2
@track1 5/8 

[track1]

noteDuration=1/6
C5 1/4
C4 1/4
G4 1/4
Eb4 1/4
Eb5 1/4
F5 1/4
Eb5 1/4
D5 1/4
C5 1/4
C4 1/4
G4 1/4
Eb4 1/4
D5 1/4
C4 1/4
Bb4 1/4

[beat1]



`
export default songSource

