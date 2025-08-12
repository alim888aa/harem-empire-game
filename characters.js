// Character definitions and management
class Character {
    constructor(name, type, supportPoints = 0) {
        this.name = name;
        this.type = type;
        this.supportPoints = supportPoints;
        this.isAlive = true;
    }
}

class GameCharacters {
    constructor() {
        this.characters = new Map();
        this.initializeCharacters();
    }

    initializeCharacters() {
        // Side Characters (high tier)
        this.addCharacter('Empress Dowager', 'side');
        this.addCharacter('Prime Minister', 'side');
        this.addCharacter('Empress Consort', 'side');
        this.addCharacter('Crown Prince', 'side');

        // Minor Characters
        this.addCharacter('Concubine Mei', 'minor');
        this.addCharacter('Concubine Lin', 'minor');
        this.addCharacter('Concubine Xia', 'minor');
        this.addCharacter('Concubine Yun', 'minor');
        this.addCharacter('Concubine Jade', 'minor');
        
        this.addCharacter('Minister Chen', 'minor');
        this.addCharacter('Minister Wang', 'minor');
        this.addCharacter('Minister Liu', 'minor');
        this.addCharacter('Minister Zhang', 'minor');
        this.addCharacter('Minister Wu', 'minor');

        this.addCharacter('Prince Feng', 'minor');
        this.addCharacter('Prince Han', 'minor');
        this.addCharacter('Prince Jun', 'minor');
        this.addCharacter('Prince Lei', 'minor');
        this.addCharacter('Prince Kai', 'minor');

        // Guide
        this.addCharacter('Maid Ling', 'guide');

        // Emperor (antagonist)
        this.addCharacter('Emperor', 'emperor');
    }

    addCharacter(name, type) {
        this.characters.set(name, new Character(name, type));
    }

    getCharacter(name) {
        return this.characters.get(name);
    }

    getAllCharacters() {
        return Array.from(this.characters.values());
    }

    getCharactersByType(type) {
        return this.getAllCharacters().filter(char => char.type === type && char.isAlive);
    }

    getInteractableCharacters() {
        return this.getAllCharacters().filter(char => 
            char.type !== 'emperor' && char.isAlive
        );
    }

    removeCharacter(name) {
        const character = this.getCharacter(name);
        if (character) {
            character.isAlive = false;
        }
    }

    giveSupport(characterName, points) {
        const character = this.getCharacter(characterName);
        if (character) {
            character.supportPoints += points;
            return true;
        }
        return false;
    }

    removeSupport(characterName, points) {
        const character = this.getCharacter(characterName);
        if (character) {
            character.supportPoints = Math.max(0, character.supportPoints - points);
            return true;
        }
        return false;
    }
}