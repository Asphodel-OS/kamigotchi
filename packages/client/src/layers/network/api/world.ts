import { createAdminAPI } from './admin';
import background from 'assets/data/kami/Background.csv';
import body from 'assets/data/kami/Body.csv';
import color from 'assets/data/kami/Color.csv';
import face from 'assets/data/kami/Face.csv';
import hand from 'assets/data/kami/Hand.csv';

export function setUpWorldAPI(systems: any) {
  function initWorld() {
    initTraits();
  }

  function csvToMap(arr: any) {
    console.log(arr);
    let jsonObj = [];
    let headers = arr[0];
    for (let i = 1; i < arr.length; i++) {
      let data = arr[i];
      // let obj: {[key: string]: number};
      let mp = new Map();
      for (let j = 0; j < data.length; j++) {
        mp.set(headers[j].trim(), data[j].trim() ? data[j].trim() : "0");
      }
      jsonObj.push(mp);
    }

    return jsonObj;
  }

  async function initTraits() {

    let count = 0;

    function initSingle(dataRaw: any, type: string) {
      const data = csvToMap(dataRaw);
      for (let i = 0; i < data.length; i++) {
        createAdminAPI(systems).registry.trait.create(
          count++, // registry index
          data[i].get("Harmony"), // value, chenge to individual stats. only harmony for now
          data[i].get("Index"), // genus, equiv to individual item index
          type, // type: body, color, etc
          data[i].has("Affinity") ? data[i].get("Affinity") : "", // affinity: may not have
          data[i].get("Name") // name of trait
        );
      }
    }

    initSingle(background, "BACKGROUND");
    initSingle(body, "BODY");
    initSingle(color, "COLOR");
    initSingle(face, "FACE");
    initSingle(hand, "HAND");

  }

  return {
    initWorld,
  }
}



