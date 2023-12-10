import {SongEditorComponent} from "@songwalker/components";
import songSource from "@app/song/test.song.source.js";

export default function Home() {
    return (
        <>
            <header className="App-header">
            </header>
            <main className="flex flex-col items-center">
                <SongEditorComponent className="absolute left-0 right-0 top-0 bottom-0" initialValue={songSource}/>
            </main>
        </>
    )
}
