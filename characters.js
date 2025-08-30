// Character definitions and management
class Character {
    constructor(name, type, supportPoints = 0) {
        this.name = name;
        this.type = type;
        this.supportPoints = supportPoints;
        this.isAlive = true;

        // NEW: Vector personality system
        this.vector = this.generateInitialVector(type, name);
        this.interactionHistory = [];
    }

    generateInitialVector(type, name) {
        const presets = {
            // Side characters: Major court figures with high influence
            side: {
                trust: 0.2 + Math.random() * 0.3,
                fear: 0.2 + Math.random() * 0.3,
                ambition: 0.6 + Math.random() * 0.3,
                loyalty: 0.4 + Math.random() * 0.4,
                influence: 0.7 + Math.random() * 0.3
            },

            // Minor characters: Vary by their role
            minor: {
                trust: 0.3 + Math.random() * 0.4,
                fear: 0.3 + Math.random() * 0.4,
                ambition: 0.3 + Math.random() * 0.6,
                loyalty: 0.4 + Math.random() * 0.5,
                influence: 0.1 + Math.random() * 0.3
            },

            // Guide characters: Helpful but cautious
            guide: {
                trust: 0.6 + Math.random() * 0.3,
                fear: 0.4 + Math.random() * 0.3,
                ambition: 0.1 + Math.random() * 0.3,
                loyalty: 0.5 + Math.random() * 0.3,
                influence: 0.2 + Math.random() * 0.2
            },

            // Emperor: Maximum power and paranoia
            emperor: {
                trust: 0.1 + Math.random() * 0.2,
                fear: 0.3 + Math.random() * 0.4,
                ambition: 0.9 + Math.random() * 0.1,
                loyalty: 1.0, // Loyal to themselves
                influence: 1.0
            }
        };

        let baseVector = presets[type] || presets.minor;

        // Individual character tweaks based on their role
        if (name.includes('Prince')) {
            baseVector.loyalty = Math.max(0.6, baseVector.loyalty); // Princes generally loyal
            baseVector.influence = Math.max(0.4, baseVector.influence);
        }

        if (name.includes('Minister')) {
            baseVector.ambition = Math.max(0.5, baseVector.ambition); // Ministers are ambitious
            baseVector.loyalty = 0.3 + Math.random() * 0.5; // Varies widely
        }

        if (name.includes('Concubine')) {
            baseVector.fear = Math.max(0.4, baseVector.fear); // Vulnerable position
            baseVector.trust = Math.min(0.4, baseVector.trust); // Cautious
        }

        // Special named characters
        if (name === 'Crown Prince') {
            baseVector.loyalty = Math.max(0.7, baseVector.loyalty);
            baseVector.ambition = Math.max(0.6, baseVector.ambition);
        }

        if (name === 'Empress Dowager') {
            baseVector.influence = Math.max(0.8, baseVector.influence);
            baseVector.ambition = Math.max(0.7, baseVector.ambition);
        }

        if (name === 'Prime Minister') {
            baseVector.ambition = Math.max(0.8, baseVector.ambition);
            baseVector.influence = Math.max(0.7, baseVector.influence);
        }

        return baseVector;
    }

    // Update vector based on interactions
    updateVector(changes) {
        Object.keys(changes).forEach(key => {
            if (this.vector[key] !== undefined) {
                this.vector[key] = Math.max(0, Math.min(1, this.vector[key] + changes[key]));
            }
        });
    }

    // Get personality description for UI
    getPersonalityHints() {
        let hints = [];

        if (this.vector.ambition > 0.7) hints.push("Ambitious");
        if (this.vector.loyalty < 0.3) hints.push("Disloyal");
        if (this.vector.loyalty > 0.7) hints.push("Loyal");
        if (this.vector.fear > 0.7) hints.push("Fearful");
        if (this.vector.trust > 0.7) hints.push("Trusting");
        if (this.vector.influence > 0.7) hints.push("Influential");

        return hints.join(", ") || "Neutral";
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