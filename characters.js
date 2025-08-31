// Character definitions and management
class Character {
    constructor(name, type, supportPoints = 0) {
        this.name = name;
        this.type = type;
        this.isAlive = true;

        // NEW: Vector personality system
        this.vector = this.generateInitialVector(type, name);
        this.relationshipVector = this.generateInitialRelationshipVector(type);
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
                influence: 0.7 + Math.random() * 0.3,
                suspicion: 0 // Everyone starts with no suspicion
            },

            // Minor characters: Vary by their role
            minor: {
                trust: 0.3 + Math.random() * 0.4,
                fear: 0.3 + Math.random() * 0.4,
                ambition: 0.3 + Math.random() * 0.6,
                loyalty: 0.4 + Math.random() * 0.5,
                influence: 0.1 + Math.random() * 0.3,
                suspicion: 0
            },

            // Guide characters: Helpful but cautious
            guide: {
                trust: 0.6 + Math.random() * 0.3,
                fear: 0.4 + Math.random() * 0.3,
                ambition: 0.1 + Math.random() * 0.3,
                loyalty: 0.5 + Math.random() * 0.3,
                influence: 0.2 + Math.random() * 0.2,
                suspicion: 0
            },

            // Emperor: Maximum power and paranoia
            emperor: {
                trust: 0.1 + Math.random() * 0.2,
                fear: 0.3 + Math.random() * 0.4,
                ambition: 0.9 + Math.random() * 0.1,
                loyalty: 1.0, // Loyal to themselves
                influence: 1.0,
                suspicion: 0
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

    // NEW: Generate initial relationship vectors with player
    generateInitialRelationshipVector(type) {
        const baseRelationships = {
            side: {
                trustInPlayer: 0.15 + Math.random() * 0.25,     // Increased from 0.1-0.3
                loyaltyToPlayer: 0.05 + Math.random() * 0.15,   // Increased from 0.0-0.1
                fearOfPlayer: 0.1 + Math.random() * 0.2,        // Same
                dependenceOnPlayer: 0.05 + Math.random() * 0.15 // Increased from 0.0-0.1
            },
            minor: {
                trustInPlayer: 0.25 + Math.random() * 0.25,     // Increased from 0.2-0.5
                loyaltyToPlayer: 0.05 + Math.random() * 0.15,   // Increased from 0.0-0.1
                fearOfPlayer: 0.1 + Math.random() * 0.3,        // Same
                dependenceOnPlayer: 0.15 + Math.random() * 0.20 // Increased from 0.1-0.3
            },
            guide: {
                trustInPlayer: 0.5 + Math.random() * 0.3,       // Same
                loyaltyToPlayer: 0.15 + Math.random() * 0.20,   // Increased from 0.1-0.3
                fearOfPlayer: 0.2 + Math.random() * 0.2,        // Same
                dependenceOnPlayer: 0.25 + Math.random() * 0.20 // Increased from 0.2-0.4
            },
            emperor: {
                trustInPlayer: 0.0,                             // Emperor trusts no one
                loyaltyToPlayer: 0.0,                           // Only loyal to self
                fearOfPlayer: 0.0,                              // Fears no one
                dependenceOnPlayer: 0.0                         // Completely independent
            }
        };

        return baseRelationships[type] || baseRelationships.minor;
    }

    // NEW: Calculate support level from relationship vectors (trust-weighted)
    get supportLevel() {
        return Math.min(100, Math.round(
            (this.relationshipVector.trustInPlayer * 50) +      // Increased from 40
            (this.relationshipVector.loyaltyToPlayer * 25) +    // Decreased from 30
            (this.relationshipVector.dependenceOnPlayer * 15) + // Decreased from 20
            ((1 - this.relationshipVector.fearOfPlayer) * 10)   // Unchanged
        ));
    }

    // Update vector based on interactions
    updateVector(changes) {
        Object.keys(changes).forEach(key => {
            if (this.vector[key] !== undefined) {
                this.vector[key] = Math.max(0, Math.min(1, this.vector[key] + changes[key]));
            }
        });
    }

    // NEW: Update relationship vector with player
    updateRelationshipVector(changes) {
        Object.keys(changes).forEach(key => {
            if (this.relationshipVector[key] !== undefined) {
                this.relationshipVector[key] = Math.max(0, Math.min(1, this.relationshipVector[key] + changes[key]));
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
        if (this.vector.suspicion > 0.5) hints.push("Suspicious");

        return hints.join(", ") || "Neutral";
    }

    // NEW: Get detailed stats for display when trust is high enough
    getDetailedStats() {
        return {
            // Personality vectors
            fear: Math.round(this.vector.fear * 100),
            ambition: Math.round(this.vector.ambition * 100),
            loyalty: Math.round(this.vector.loyalty * 100),
            influence: Math.round(this.vector.influence * 100),
            suspicion: Math.round(this.vector.suspicion * 100),

            // Relationship vectors
            trustInPlayer: Math.round(this.relationshipVector.trustInPlayer * 100),
            loyaltyToPlayer: Math.round(this.relationshipVector.loyaltyToPlayer * 100),
            fearOfPlayer: Math.round(this.relationshipVector.fearOfPlayer * 100),
            dependenceOnPlayer: Math.round(this.relationshipVector.dependenceOnPlayer * 100)
        };
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

    // REMOVED: Old support system - now calculated from relationship vectors
}