/** Original names remain stable actor IDs. Expelled office holders retain only a history record; demotion does not restore them. */
export const displacedOfficeForRank=(rank:string|null):string|null=>({
 crown_prince:'Crown Prince',prime_minister:'Prime Minister',empress:'Empress Consort',empress_consort:'Empress Consort',
} as Record<string,string>)[rank??'']??null;

export const displayCharacterName=(character:{name:string;displayName?:string})=>character.displayName??character.name;
