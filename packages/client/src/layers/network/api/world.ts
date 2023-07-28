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
    // inits a single type of trait, returns number of traits
    async function initSingle(dataRaw: any, type: string) {
      const data = csvToMap(dataRaw);
      for (let i = 0; i < data.length; i++) {
        await sleepIf();
        createAdminAPI(systems).registry.trait.create(
          data[i].get("Index"), // individual trait index
          data[i].get("Health") ? data[i].get("Health") : 0,
          data[i].get("Power") ? data[i].get("Power") : 0,
          data[i].get("Violence") ? data[i].get("Violence") : 0,
          data[i].get("Harmony") ? data[i].get("Harmony") : 0,
          data[i].get("Slots") ? data[i].get("Slots") : 0,
          data[i].get("Tier") ? data[i].get("Tier") : 0,
          data[i].get("Affinity") ? data[i].get("Affinity").toUpperCase() : "",
          data[i].get("Name"), // name of trait
          type, // type: body, color, etc
        );
      }

      // -1 because max includes 0, should remove this
      return data.length - 1;
    }

    const numBg = await initSingle(background, "BACKGROUND");
    const numBody = await initSingle(body, "BODY");
    const numColor = await initSingle(color, "COLOR");
    const numFace = await initSingle(face, "FACE");
    const numHand = await initSingle(hand, "HAND");
  }

  // try to update traits. meant for partial deployments to fill up the gaps
  async function initTraitsWithFail() {
    // inits a single type of trait, returns number of traits
    async function initSingle(dataRaw: any, type: string) {
      const data = csvToMap(dataRaw);
      for (let i = 0; i < data.length; i++) {
        await sleepIf();
        try {
          createAdminAPI(systems).registry.trait.create(
            data[i].get("Index"), // individual trait index
            data[i].get("Health") ? data[i].get("Health") : 0,
            data[i].get("Power") ? data[i].get("Power") : 0,
            data[i].get("Violence") ? data[i].get("Violence") : 0,
            data[i].get("Harmony") ? data[i].get("Harmony") : 0,
            data[i].get("Slots") ? data[i].get("Slots") : 0,
            data[i].get("Tier") ? data[i].get("Tier") : 0,
            data[i].get("Affinity") ? data[i].get("Affinity").toUpperCase() : "",
            data[i].get("Name"), // name of trait
            type, // type: body, color, etc
          );
        } catch { }
      }

      // -1 because max includes 0, should remove this
      return data.length - 1;
    }

    const numBg = await initSingle(background, "BACKGROUND");
    const numBody = await initSingle(body, "BODY");
    const numColor = await initSingle(color, "COLOR");
    const numFace = await initSingle(face, "FACE");
    const numHand = await initSingle(hand, "HAND");
  }

  return {
    initWorld: initWorld,
    tryInitTraits: initTraitsWithFail,
  }

  function sleepIf() {
    if (process.env.MODE == 'OPGOERLI') {
      return new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}



