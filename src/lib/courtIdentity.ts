// Owns display names; career office identity keeps its supported compatibility export.
export { displacedOfficeForRank } from './career';

export const displayCharacterName=(character:{name:string;displayName?:string})=>character.displayName??character.name;
