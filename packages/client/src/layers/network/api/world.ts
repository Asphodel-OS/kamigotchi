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
    function initSingle(dataRaw: any, type: string) {
      const data = csvToMap(dataRaw);
      for (let i = 0; i < data.length; i++) {
        createAdminAPI(systems).registry.trait.create(
          data[i].get("Index"), // individual trait index
          data[i].get("Health") ? data[i].get("Health") : "0",
          data[i].get("Power") ? data[i].get("Power") : "0",
          data[i].get("Violence") ? data[i].get("Violence") : "0",
          data[i].get("Harmony") ? data[i].get("Harmony") : "0",
          data[i].get("Slots") ? data[i].get("Slots") : "0",
          data[i].get("Rarity") ? rarityParser(data[i].get("Rarity")) : 0,
          data[i].get("Affinity") ? data[i].get("Affinity").toUpperCase() : "",
          data[i].get("Name"), // name of trait
          type, // type: body, color, etc
        );
      }

      // -1 because max includes 0, should remove this
      return data.length - 1;
    }

    function rarityParser(rarity: string) {
      switch (rarity) {
        case "Common":
          return 3;
        case "Rare":
          return 2;
        case "Epic":
          return 1;
        default:
          return 0;
      }
    }

    const numBg = initSingle(background, "BACKGROUND");
    const numBody = initSingle(body, "BODY");
    const numColor = initSingle(color, "COLOR");
    const numFace = initSingle(face, "FACE");
    const numHand = initSingle(hand, "HAND");

    // init max elements and set revealed
    // ORDER: color, background, body, hand, face
    systems['system.ERC721.metadata']._setRevealed(
      '123', // salt! should be random
      'https://kami-image.asphodel.io/image/'
    );
  }

  return {
    initWorld,
  }
}



