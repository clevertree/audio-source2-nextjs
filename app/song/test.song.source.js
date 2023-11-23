const songSource = `
lead=loadInstrument("./instruments/oscillator", {duration: 1/4T})
lead2=loadInstrument("./instruments/oscillator", {'type':'square'})
lead.config.type='pulse';
lead.config.pulseWidth=0.5;
lead.config.envelop.mixer=1;
lead2.config.type='square';
lead.config.envelop.mixer=0.5;


wut='ohok';omfg='1230WUT2of' ; rully='yup' bpm=120
!lead
@track1 3/8 
!lead2
@track1 5/8 3T dfd;
ddd

[track1]

C5:1/4D; 1/4;
C4:1/4D:0.8;1/4;
G4:1/4 1/4
Eb4:1/4D:0.8 1/4
Eb5:1/4T 1/4
F5:1/4T 1/4
Eb5:1/4T 1/4
D5:1/4T 1/4
C5:1/4D 1/4
C4:1/4D:0.8 1/4
G4:1/4 1/4
Eb4:1/4D:0.8 1/4
D5:1/4 1/4
C4:1/4:.8 1/4
Bb4:1/4 1/4

DDE83Fr7CSVD8234

A4E4B292324 12 134

F3D3E4B72 3

F3 1/2 4/3T 2/43

`
export default songSource