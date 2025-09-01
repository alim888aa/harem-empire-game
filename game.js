// Main game logic
class HaremEmpireGame {
    constructor() {
        console.log('HaremEmpireGame constructor called');
        this.characters = new GameCharacters();
        this.player = {
            type: null,
            rank: null,
            supportPoints: 0,
            giftsRemaining: 15,
            season: 1,
            isAlive: true,
            hasBeenPromoted: false, // Track promotion status
            // Player vector system
            vector: null,
            reputation: {
                perceivedLoyalty: 0.5,
                perceivedThreat: 0.3,
                politicalSkill: 0.4,
                trustworthiness: 0.6
            }
        };
        this.rankProgression = {
            concubine: ['Concubine', 'Empress Consort', 'Emperor'],
            minister: ['Minister', 'Prime Minister', 'Emperor'],
            prince: ['Prince', 'Crown Prince', 'Emperor']
        };
        this.init();
    }

    init() {
        console.log('Initializing game');
        this.bindEvents();
        this.showCharacterSelection();
        console.log('Game initialization complete');
    }

    bindEvents() {
        console.log('Binding events');
        // Character selection
        const characterBtns = document.querySelectorAll('.character-btn');
        console.log('Found character buttons:', characterBtns.length);

        characterBtns.forEach(btn => {
            console.log('Binding event to button:', btn.dataset.type);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = e.currentTarget.dataset.type;
                console.log('Button clicked, starting game with type:', type);
                this.startGame(type);
            });
        });

        // Game controls
        document.getElementById('next-season').addEventListener('click', () => {
            this.nextSeason();
        });

        // Modal controls
        document.getElementById('give-emperor-gifts').addEventListener('click', () => {
            this.giveEmperorGifts();
        });

        document.getElementById('refuse-emperor').addEventListener('click', () => {
            this.refuseEmperor();
        });

        document.getElementById('accept-promotion').addEventListener('click', () => {
            this.acceptPromotion();
        });

        document.getElementById('restart-game').addEventListener('click', () => {
            this.restartGame();
        });
    }

    startGame(type) {
        console.log('startGame called with:', type);
        this.player.type = type;
        this.player.rank = this.rankProgression[type][0];
        this.player.vector = this.initializePlayerVector(type); // NEW
        
        // NEW: Apply initial fear based on starting influence
        this.applyInitialInfluenceFear();
        
        console.log('Player rank set to:', this.player.rank);
        this.updateUI();
        this.showGameScreen();
        this.renderCharacterInteractions();
    }

    // NEW: Apply initial influence-based fear at game start
    applyInitialInfluenceFear() {
        if (this.player.vector.influence <= 0.0) return;
        
        const influenceLevel = this.player.vector.influence;
        const fearIncrease = 0.5 * (influenceLevel / 1.0); // Scale based on influence
        
        this.characters.getAllCharacters().forEach(char => {
            if (char.isAlive && char.type !== 'emperor') {
                char.updateVector({ fear: fearIncrease });
            }
        });
    }

    // NEW: Initialize player vector based on starting path
    initializePlayerVector(type) {
        const playerVectors = {
            prince: {
                loyalty: 0.8,
                ambition: 0.6,
                influence: 0.5,  // Reduced from 0.7
                suspicion: 0.1,
                fear: 0.2
            },
            minister: {
                loyalty: 0.5,
                ambition: 0.8,
                influence: 0.3,  // Reduced from 0.5
                suspicion: 0.2,
                fear: 0.3
            },
            concubine: {
                loyalty: 0.3,
                ambition: 0.7,
                influence: 0.0,  // Reduced from 0.2
                suspicion: 0.4,
                fear: 0.5
            }
        };
        
        return playerVectors[type] || playerVectors.minister;
    }

    // NEW: Get player relationship bonuses based on character type
    getPlayerRelationshipBonus() {
        const bonuses = {
            prince: {
                trustMultiplier: 1.5,    // Princes build trust 50% faster
                loyaltyMultiplier: 1.3,  // Natural authority
                dependenceMultiplier: 1.0, // Nerfed from 1.2
                description: "Royal blood commands respect"
            },
            minister: {
                trustMultiplier: 1.2,    // Ministers are skilled politicians
                loyaltyMultiplier: 1.0,  // Standard loyalty building
                dependenceMultiplier: 1.0, // Nerfed from 1.4
                description: "Political experience helps"
            },
            concubine: {
                trustMultiplier: 0.8,    // Harder to build trust (vulnerable position)
                loyaltyMultiplier: 0.9,  // Harder to inspire loyalty
                dependenceMultiplier: 1.0, // Nerfed from 1.1
                description: "Must work harder for respect"
            }
        };
        
        return bonuses[this.player.type] || bonuses.minister;
    }

    // NEW: Compound growth bonus based on existing trust (like old trust bonuses)
    getTrustCompoundBonus(character) {
        const currentTrust = character.relationshipVector.trustInPlayer;
        
        if (currentTrust >= 0.8) {
            return 1.8; // 80% bonus for high trust relationships
        } else if (currentTrust >= 0.6) {
            return 1.4; // 40% bonus for medium trust relationships
        } else if (currentTrust >= 0.4) {
            return 1.2; // 20% bonus for developing relationships
        } else {
            return 1.0; // No bonus for low trust
        }
    }

    showCharacterSelection() {
        document.getElementById('character-selection').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
    }

    showGameScreen() {
        console.log('Showing game screen');
        const charSelection = document.getElementById('character-selection');
        const gameScreen = document.getElementById('game-screen');

        console.log('Character selection element:', charSelection);
        console.log('Character selection classes before:', charSelection.className);
        console.log('Game screen element:', gameScreen);
        console.log('Game screen classes before:', gameScreen.className);

        charSelection.classList.add('hidden');
        gameScreen.classList.remove('hidden');

        console.log('Character selection classes after:', charSelection.className);
        console.log('Game screen classes after:', gameScreen.className);
        console.log('Screen transition complete');
    }

    renderCharacterInteractions() {
        console.log('Rendering character interactions');
        const characterList = document.getElementById('character-list');
        console.log('Character list element:', characterList);
        characterList.innerHTML = '';

        const interactableChars = this.characters.getInteractableCharacters();
        console.log('Interactable characters:', interactableChars.length);

        interactableChars.forEach((character, index) => {
            console.log(`Creating character div ${index + 1}:`, character.name);
            const charDiv = document.createElement('div');
            charDiv.className = 'character-interaction';

            const giftCost = character.type === 'side' ? 5 : 1;
            const supportGain = 10;
            
            // NEW: Get personality hints and detailed stats
            const personalityHints = character.getPersonalityHints();
            const canShowStats = character.relationshipVector.trustInPlayer >= 0.5;
            
            let statsDisplay = '';
            if (canShowStats) {
                const stats = character.getDetailedStats();
                statsDisplay = `
                    <div class="character-stats" style="font-size: 11px; color: #444; margin-top: 8px; border-top: 1px solid #ccc; padding-top: 5px;">
                        <p><strong>Relationship:</strong></p>
                        <p>Trust: ${stats.trustInPlayer}% | Loyalty: ${stats.loyaltyToPlayer}%</p>
                        <p>Fear: ${stats.fearOfPlayer}% | Dependence: ${stats.dependenceOnPlayer}%</p>
                        <p><strong>Personality:</strong></p>
                        <p>Ambition: ${stats.ambition}% | Empire Loyalty: ${stats.loyalty}%</p>
                        <p>Influence: ${stats.influence}% | <span style="color: ${this.getSuspicionColor(stats.suspicion)}; font-weight: bold;">Suspicion: ${stats.suspicion}%</span></p>
                    </div>
                `;
            }

            charDiv.innerHTML = `
                <div class="character-info">
                    <h4>${character.name}</h4>
                    <p>Type: ${character.type}</p>
                    <p><strong>Support: ${character.supportLevel}/100</strong></p>
                    <p class="personality-hint" style="font-style: italic; color: #666;">
                        Personality: ${personalityHints}
                    </p>
                    ${statsDisplay}
                </div>
                <div class="character-actions">
                    <button class="gift-btn" data-character="${character.name}" data-cost="${giftCost}" data-support="${supportGain}">
                        Give Gift (${giftCost} gifts)
                    </button>
                    <button class="message-btn" data-character="${character.name}" data-cost="${giftCost}" data-support="${supportGain}">
                        Gift with Message (${giftCost} gifts)
                    </button>
                    <button class="spit-btn" data-character="${character.name}">
                        Spit in Face (-20 support)
                    </button>
                </div>
            `;

            characterList.appendChild(charDiv);
            console.log(`Appended character div for ${character.name}`);
        });

        console.log('All character divs created. Character list children:', characterList.children.length);

        // Bind interaction events
        document.querySelectorAll('.gift-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const character = e.target.dataset.character;
                const cost = parseInt(e.target.dataset.cost);
                const support = parseInt(e.target.dataset.support);
                this.giveGift(character, cost, support);
            });
        });

        document.querySelectorAll('.message-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const character = e.target.dataset.character;
                const cost = parseInt(e.target.dataset.cost);
                const support = parseInt(e.target.dataset.support);
                this.showMessageModal(character, cost, support);
            });
        });

        document.querySelectorAll('.spit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const character = e.target.dataset.character;
                this.spitInFace(character);
            });
        });
    }
    
    showMessageModal(characterName, cost, support) {
        const character = this.characters.getCharacter(characterName);
        const messageOptions = this.generateMessageOptions();
        
        const modalHTML = `
            <div id="message-modal" class="modal">
                <div class="modal-content">
                    <h3>Choose Your Message to ${characterName}</h3>
                    <p>What approach will you take with your gift?</p>
                    <div class="message-options" style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0;">
                        ${messageOptions.map((message, index) => `
                            <button class="message-option" data-index="${index}" style="padding: 15px; text-align: left; border: 2px solid #DAA520; border-radius: 8px; background: #F5DEB3; cursor: pointer; transition: all 0.2s ease;">
                                "${message.text}"
                            </button>
                        `).join('')}
                    </div>
                    <button id="cancel-message" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add hover effects
        document.querySelectorAll('.message-option').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.background = '#DAA520';
                btn.style.color = 'white';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = '#F5DEB3';
                btn.style.color = 'black';
            });
        });
        
        // Bind events
        document.querySelectorAll('.message-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const messageIndex = parseInt(e.target.dataset.index);
                this.giveGift(characterName, cost, support, messageIndex);
                document.getElementById('message-modal').remove();
            });
        });
        
        document.getElementById('cancel-message').addEventListener('click', () => {
            document.getElementById('message-modal').remove();
        });
    }

    // NEW: Generate universal message options
    generateMessageOptions() {
        return [
            {
                text: "Your talents deserve greater recognition",
                type: "ambitious",
                keywords: ["talents", "recognition", "deserve"]
            },
            {
                text: "Your dedication to the empire inspires me", 
                type: "loyal",
                keywords: ["empire", "dedication", "inspire"]
            },
            {
                text: "We must be careful in these dangerous times",
                type: "cautious", 
                keywords: ["careful", "dangerous", "times"]
            },
            {
                text: "Perhaps we can help each other prosper",
                type: "neutral",
                keywords: ["help", "prosper", "together"]
            }
        ];
    }

    giveGift(characterName, cost, supportGain, messageIndex = -1) {
        if (this.player.giftsRemaining >= cost) {
            const character = this.characters.getCharacter(characterName);
            
            // NEW: Vector-based response calculation
            let actualSupportGain = supportGain;
            let characterResponse = "";
            
            if (messageIndex >= 0) {
                const messageOptions = this.generateMessageOptions();
                const response = this.analyzeMessageChoice(messageIndex, character, messageOptions);
                
                // Apply personality vector changes (suspicion, etc.)
                character.updateVector(response.vectorChanges);
                
                // Apply relationship vector changes
                character.updateRelationshipVector(response.relationshipChanges);
                
                // Recalculate supportLevel from relationship vectors for message gifts
                character.supportLevel = character.calculateSupportLevel();
                
                // Get character response
                characterResponse = this.getResponseByType(character, response.responseType);
                
                // Update player vector based on action
                this.updatePlayerVector(messageOptions[messageIndex].type, character);

                // Fear increases with every gift based on influence
                if (this.player.vector.influence > 0 && response.responseType === "fearful_appreciative") {
                    const fearIncrease = 0.1 * this.player.vector.influence; // Scale with influence
                    character.updateRelationshipVector({ fearOfPlayer: fearIncrease });
                }

                // Check for execution after interaction
                if (this.checkForExecution()) return;
                
                // NEW: Check for suspicion warnings (only for Prince/Minister)
                this.checkSuspicionWarnings();
            } else {
                // Simple gift without message - add +1 directly to supportLevel variable
                character.supportLevel = Math.min(100, character.supportLevel + 1);
                

            }
            
            this.player.giftsRemaining -= cost;
            
            // Show character response if there was a message
            if (characterResponse) {
                setTimeout(() => {
                    alert(characterResponse);
                }, 100);
            }
            
            this.updateUI();
            this.renderCharacterInteractions();
        } else {
            alert('Not enough gifts remaining!');
        }
    }

    // REMOVED: Support is now calculated from relationship vectors

    // NEW: Update player vector based on actions
    updatePlayerVector(actionType, character) {
        if (actionType === 'ambitious') {
            this.player.vector.ambition += 0.03;
            this.player.reputation.perceivedThreat += 0.05;
        } else if (actionType === 'loyal') {
            this.player.vector.loyalty += 0.03;
            this.player.reputation.perceivedLoyalty += 0.02;
        } else if (actionType === 'cautious') {
            this.player.vector.fear += 0.02;
            this.player.reputation.trustworthiness += 0.01;
        }
        
        // Successful manipulation increases political skill
        if (character.vector.trust > 0.8) {
            this.player.reputation.politicalSkill += 0.01;
        }
        
        // Keep values in bounds
        Object.keys(this.player.vector).forEach(key => {
            this.player.vector[key] = Math.max(0, Math.min(1, this.player.vector[key]));
        });
        Object.keys(this.player.reputation).forEach(key => {
            this.player.reputation[key] = Math.max(0, Math.min(1, this.player.reputation[key]));
        });
    }

    // NEW: Check for execution based on suspicion levels (enhanced)
    checkForExecution() {
        const dangerousCharacters = this.characters.getAllCharacters().filter(char => {
            if (!char.isAlive || char.type === 'emperor') return false;
            
            // NEW: More nuanced thresholds
            let threshold = 0.8; // Default
            
            if (char.vector.loyalty > 0.7) {
                threshold = 0.7; // Loyal characters snitch easier
            } else if (char.vector.loyalty > 0.5) {
                threshold = 0.75; // Moderately loyal characters
            }
            
            if (char.relationshipVector.trustInPlayer > 0.8) {
                threshold += 0.1; // High trust gives benefit of doubt
            } else if (char.relationshipVector.trustInPlayer > 0.6) {
                threshold += 0.05; // Medium trust gives small benefit
            }
            
            // Fear makes characters more likely to snitch (lower threshold)
            if (char.vector.fear > 0.7) {
                threshold -= 0.1;
            }
            
            return char.vector.suspicion >= threshold;
        });
        
        if (dangerousCharacters.length > 0) {
            const snitch = dangerousCharacters[0];
            this.showGameOver('Execution', 
                `${snitch.name} reported your suspicious activities to the Emperor. You have been executed for treason.`);
            return true;
        }
        return false;
    }

    // NEW: Check for suspicion warnings (only for Prince/Minister)
    checkSuspicionWarnings() {
        // Only warn Princes and Ministers, not Concubines
        if (this.player.type === 'concubine') return;
        
        const dangerousCharacters = this.characters.getAllCharacters().filter(char => {
            if (!char.isAlive || char.type === 'emperor') return false;
            
            let threshold = 0.8;
            if (char.vector.loyalty > 0.7) threshold = 0.7;
            if (char.vector.loyalty > 0.5) threshold = 0.75;
            if (char.relationshipVector.trustInPlayer > 0.8) threshold += 0.1;
            if (char.relationshipVector.trustInPlayer > 0.6) threshold += 0.05;
            if (char.vector.fear > 0.7) threshold -= 0.1;
            
            // Warn at 50% of threshold (as requested)
            return char.vector.suspicion >= (threshold * 0.5);
        });
        
        if (dangerousCharacters.length > 0) {
            const warningChar = dangerousCharacters[0];
            const warningLevel = Math.round(warningChar.vector.suspicion * 100);
            
            setTimeout(() => {
                alert(`⚠️ Warning: ${warningChar.name} seems increasingly suspicious of you (${warningLevel}% suspicion). Be careful!`);
            }, 200);
        }
    }
    
    // NEW: Analyze message choice and character compatibility (enhanced)
    analyzeMessageChoice(messageIndex, character, messageOptions) {
        const messageChoice = messageOptions[messageIndex];
        const { type } = messageChoice;
        const playerBonus = this.getPlayerRelationshipBonus();
        
        let vectorChanges = {}; // Personality changes
        let relationshipChanges = {}; // Relationship with player changes
        let responseType = 'neutral';
        
        // Base relationship changes (before bonuses)
        let baseTrust = 0;
        let baseLoyalty = 0;
        let baseDependence = 0;
        let baseFear = 0;
        
        if (type === "ambitious") {
            if (character.vector.ambition > 0.8 && character.vector.loyalty < 0.6) {
                // Perfect match - big relationship boost
                baseTrust = 0.25;
                baseLoyalty = 0.20;
                baseDependence = 0.15;
                vectorChanges.ambition = 0.05;
                responseType = 'ambitious_positive';
            } else if (character.vector.loyalty > 0.6) {
                // Bad match - relationship damage
                baseTrust = -0.15;
                baseFear = 0.15;
                vectorChanges.suspicion = 0.3;
                responseType = 'loyal_suspicious';
            } else {
                // Neutral reaction
                baseTrust = 0.08;
                baseDependence = 0.05;
                responseType = 'neutral';
            }
        } else if (type === "loyal") {
            if (character.vector.loyalty > 0.7) {
                // Perfect match
                baseTrust = 0.20;
                baseLoyalty = 0.25;
                baseDependence = 0.10;
                responseType = 'loyal_positive';
                
                // NEW: Loyal messages reduce suspicion
                vectorChanges.suspicion = -0.1;
            } else if (character.vector.ambition > 0.7 && character.vector.loyalty < 0.5) {
                // They see you as naive
                baseTrust = -0.1;
                responseType = 'ambitious_dismissive';
            } else {
                baseTrust = 0.10;
                baseLoyalty = 0.08;
                responseType = 'neutral';
            }
        } else if (type === "cautious") {
            if (character.vector.fear > 0.6) {
                baseTrust = 0.15;
                baseDependence = 0.1;
                vectorChanges.fear = 0.1; // Changed: now INCREASES fear (talking about dangers makes them more afraid)
                responseType = 'fearful_appreciative';
            } else {
                baseTrust = 0.08;
                baseDependence = 0.05;
                responseType = 'neutral';
            }
        } else if (type === "neutral") {
            baseTrust = 0.12;
            baseDependence = 0.05;
            responseType = 'neutral';
        }
        
        // Apply player type bonuses
        relationshipChanges.trustInPlayer = baseTrust * playerBonus.trustMultiplier;
        relationshipChanges.loyaltyToPlayer = baseLoyalty * playerBonus.loyaltyMultiplier;
        relationshipChanges.dependenceOnPlayer = baseDependence * playerBonus.dependenceMultiplier;
        if (baseFear !== 0) {
            relationshipChanges.fearOfPlayer = baseFear; // Fear not affected by player bonuses
        }
        
        // Apply compound growth bonus based on existing trust
        const trustBonus = this.getTrustCompoundBonus(character);
        if (trustBonus > 1 && this.player.type === 'prince') {
            relationshipChanges.trustInPlayer *= trustBonus;
            relationshipChanges.loyaltyToPlayer *= trustBonus;
            relationshipChanges.dependenceOnPlayer *= trustBonus;
        } else if (trustBonus > 1 && this.player.type === 'minister') {
            relationshipChanges.trustInPlayer *= trustBonus/2;
            relationshipChanges.loyaltyToPlayer *= trustBonus/2;
            relationshipChanges.dependenceOnPlayer *= trustBonus/2;
        } else if (trustBonus > 1 && this.player.type === 'concubine') {
            relationshipChanges.trustInPlayer *= trustBonus/4;
            relationshipChanges.loyaltyToPlayer *= trustBonus/4;
            relationshipChanges.dependenceOnPlayer *= trustBonus/4;
        }
        
        return { vectorChanges, relationshipChanges, responseType };
    }
    
    getResponseByType(character, responseType) {
        const responses = {
            ambitious_positive: [
                `${character.name}: "Finally, someone who recognizes true potential! Your words show wisdom."`,
                `${character.name}: "Yes, talent should be rewarded. Perhaps we think alike."`,
                `${character.name}: "The current system does waste so much potential... interesting perspective."`
            ],
            loyal_suspicious: [
                `${character.name}: "Such talk makes me very uncomfortable. I hope you're not serious about this."`,
                `${character.name}: "I... I think we should speak of other matters. The walls have ears."`,
                `${character.name}: "Your words concern me. I serve the empire faithfully."`
            ],
            loyal_positive: [
                `${character.name}: "Your dedication to the empire is admirable. We need more people like you."`,
                `${character.name}: "It's refreshing to meet someone who understands duty and honor."`,
                `${character.name}: "The empire is blessed to have servants like you."`
            ],
            ambitious_dismissive: [
                `${character.name}: "Such noble words... though I wonder if you truly understand how power works."`,
                `${character.name}: "Loyalty is admirable, but perhaps naive in these times."`,
                `${character.name}: "Your idealism is... charming."`
            ],
            fearful_appreciative: [
                `${character.name}: "Yes, we must be very careful. Thank you for understanding the dangers."`,
                `${character.name}: "Finally, someone who sees the risks we all face."`,
                `${character.name}: "Your caution shows wisdom. We must watch our steps."`
            ],
            neutral: [
                `${character.name}: "Thank you for the gift. Your words are thoughtful."`,
                `${character.name}: "I appreciate your generosity and your perspective."`,
                `${character.name}: "Your gift is welcome, as is your friendship."`
            ]
        };
        
        const responseList = responses[responseType] || responses.neutral;
        return responseList[Math.floor(Math.random() * responseList.length)];
    }

    spitInFace(characterName) {
        const character = this.characters.getCharacter(characterName);
        
        // Severely damage relationship
        character.updateRelationshipVector({
            trustInPlayer: -0.4,
            loyaltyToPlayer: -0.3,
            fearOfPlayer: 0.2,
            dependenceOnPlayer: -0.2
        });
        
        // Increase their suspicion and fear
        character.updateVector({
            suspicion: 0.2,
            fear: 0.1
        });
        
        this.updateUI();
        this.renderCharacterInteractions();
    }

    nextSeason() {
        console.log('nextSeason called, current season:', this.player.season);
        // Check for emperor encounter (30% chance, but only from season 2 onwards)
        if (this.player.season >= 2 && Math.random() < 0.3) {
            console.log('Emperor encounter triggered');
            this.showEmperorEncounter();
            return;
        }

        console.log('No emperor encounter, advancing season');
        this.advanceSeason();
    }

    advanceSeason() {
        console.log('advanceSeason called, current season before increment:', this.player.season);
        this.player.season++;
        this.player.giftsRemaining += 15; // Add 15 gifts to existing gifts
        console.log('Season incremented to:', this.player.season);
        console.log('Gifts after adding 15:', this.player.giftsRemaining);

        // REMOVED: No more suspicion decay

        // Alert for new season
        alert(`Season ${this.player.season} begins! You have 15 new gifts to distribute.`);

        // Calculate total support points
        this.calculateTotalSupport();

        // Check for promotion
        this.checkPromotion();

        this.updateUI();
        this.renderCharacterInteractions();
    }

    // REMOVED: Suspicion decay - suspicion should be permanent consequences

    calculateTotalSupport() {
        let systemSupport = 0;
        
        // NEW: Dynamic support threshold - 80 before promotion, 100 after
        const isStartingRank = this.player.rank === this.rankProgression[this.player.type][0];
        const requiredSupport = isStartingRank ? 80 : 100;

        this.characters.getAllCharacters().forEach(char => {
            if (char.isAlive && char.type !== 'emperor') {
                // Only count system support when characters reach required support level
                if (char.supportLevel >= requiredSupport) {
                    if (char.type === 'side') {
                        systemSupport += 25;
                    } else if (char.type === 'minor') {
                        systemSupport += 5;
                    }
                }
            }
        });

        this.player.supportPoints = systemSupport;

        if (systemSupport > 0) {
            console.log(`System support earned: ${systemSupport} points`);
        }
    }

    checkPromotion() {
        const currentRankIndex = this.rankProgression[this.player.type].indexOf(this.player.rank);
        const nextRank = this.rankProgression[this.player.type][currentRankIndex + 1];

        if (nextRank && this.player.supportPoints >= 100) {
            if (nextRank === 'Emperor') {
                this.showVictory();
                return;
            }

            // Replace current holder of the position
            this.replaceCurrentHolder(nextRank);
            this.showPromotionModal(nextRank);
        }
    }

    replaceCurrentHolder(newRank) {
        // Remove the current holder of this position
        const currentHolder = this.characters.getAllCharacters().find(char =>
            char.name.includes(newRank) ||
            (newRank === 'Empress Consort' && char.name === 'Empress Consort') ||
            (newRank === 'Prime Minister' && char.name === 'Prime Minister') ||
            (newRank === 'Crown Prince' && char.name === 'Crown Prince')
        );
        // Remove 30 support points from all characters
        this.characters.getAllCharacters().forEach(char => {
            char.supportLevel = Math.max(0, char.supportLevel - 30);
        });

        if (currentHolder) {
            this.characters.removeCharacter(currentHolder.name);
        }
    }

    showEmperorEncounter() {
        document.getElementById('emperor-encounter').classList.remove('hidden');
    }

    giveEmperorGifts() {
        if (this.player.giftsRemaining >= 10) {
            this.player.giftsRemaining -= 10;
            document.getElementById('emperor-encounter').classList.add('hidden');
            this.advanceSeason();
        } else if (this.player.perceivedLoyalty > 0.8 && this.player.giftsRemaining < 10) {
            document.getElementById('emperor-encounter').classList.add('hidden');
            alert("Your perceived loyalty saves you from execution.")
            this.advanceSeason();
        } else {
            alert('You need 10 gifts to satisfy the Emperor!');
            this.showGameOver('Execution', 'You failed to provide enough gifts to the Emperor and were executed.');
        }
    }

    refuseEmperor() {
        if (this.player.reputation.perceivedLoyalty > 0.8 && this.player.giftsRemaining < 10) {
            document.getElementById('emperor-encounter').classList.add('hidden');
            alert("Your perceived loyalty saves you from execution.")
            this.advanceSeason();
        } else {
        this.showGameOver('Execution', 'You refused the Emperor and were executed for your insolence.');
        }
    }

    showPromotionModal(newRank) {
        document.getElementById('promotion-text').textContent =
            `You have gained enough support to become ${newRank}! You have replaced the previous holder.`;
        document.getElementById('promotion-modal').classList.remove('hidden');
        this.pendingPromotion = newRank;
    }

    acceptPromotion() {
        this.player.rank = this.pendingPromotion;
        this.player.supportPoints = 0; // Reset support points after promotion
        this.player.hasBeenPromoted = true; // Track that player has been promoted

        // NEW: Bigger influence increase on promotion
        const influenceIncrease = 0.4; // Increased from 0.3
        this.player.vector.influence = Math.min(1, this.player.vector.influence + influenceIncrease);

        // NEW: Side characters lose support when you get promoted (they see you as threat)
        this.characters.getAllCharacters().forEach(char => {
            if (char.type === 'side') {
                char.updateRelationshipVector({ 
                    trustInPlayer: -0.2,  // 20% trust loss
                    loyaltyToPlayer: -0.1 // 10% loyalty loss
                });
            }
        });

        // NEW: Apply 30% fear increase to all characters on promotion
        this.characters.getAllCharacters().forEach(char => {
            if (char.isAlive && char.type !== 'emperor') {
                const currentFear = char.relationshipVector.fearOfPlayer;
                char.relationshipVector.fearOfPlayer = Math.min(1, currentFear + 0.3);
            }
        });

        // Still apply influence-based fear
        this.applyInfluenceFear();

        document.getElementById('promotion-modal').classList.add('hidden');
        this.updateUI();
        this.renderCharacterInteractions();
    }

    // NEW: Apply influence-based fear when player has high influence
    applyInfluenceFear() {
        if (this.player.vector.influence <= 0.6) return;
        
        const influenceLevel = this.player.vector.influence - 0.6; // 0 to 0.4 range
        const fearIncrease = 0.5 * (influenceLevel / 0.4); // Increased from 0.3 to 0.5
        
        this.characters.getAllCharacters().forEach(char => {
            if (char.isAlive && char.type !== 'emperor') {
                // TODO: Skip if same faction (when factions are implemented)
                char.updateVector({ fear: fearIncrease });
            }
        });
        
        // Show notification for significant influence
        if (this.player.vector.influence > 0.8) {
            setTimeout(() => {
                alert("Your growing influence strikes fear into the hearts of courtiers...");
            }, 500);
        }
    }

    showVictory() {
        this.showGameOver('Victory!', 'Congratulations! You have overthrown the Emperor and now rule the empire!');
    }

    showGameOver(title, message) {
        document.getElementById('game-over-title').textContent = title;
        document.getElementById('game-over-text').textContent = message;
        document.getElementById('game-over').classList.remove('hidden');
        this.player.isAlive = false;
    }

    restartGame() {
        // Reset game state
        this.characters = new GameCharacters();
        this.player = {
            type: null,
            rank: null,
            supportPoints: 0,
            giftsRemaining: 15,
            season: 1,
            isAlive: true,
            hasBeenPromoted: false, // Reset promotion tracking
            vector: null,
            reputation: {
                perceivedLoyalty: 0.5,
                perceivedThreat: 0.3,
                politicalSkill: 0.4,
                trustworthiness: 0.6
            }
        };

        // Hide modals and show character selection
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });

        this.showCharacterSelection();
    }

    updateUI() {
        console.log('Updating UI with player data:', this.player);
        document.getElementById('season-counter').textContent = `Season ${this.player.season}`;
        document.getElementById('support-points').textContent = `Support: ${this.player.supportPoints}`;
        document.getElementById('gifts-remaining').textContent = `Gifts: ${this.player.giftsRemaining}`;
        document.getElementById('player-rank').textContent = `Rank: ${this.player.rank || 'None'}`;
        
        // NEW: Update player stats display
        if (this.player.vector) {
            const playerStatsText = `L:${Math.round(this.player.vector.loyalty * 100)} A:${Math.round(this.player.vector.ambition * 100)} I:${Math.round(this.player.vector.influence * 100)}`;
            document.getElementById('player-stats').textContent = playerStatsText;
            
            // Add click handler for detailed stats (only add once)
            const playerStatsElement = document.getElementById('player-stats');
            if (!playerStatsElement.hasAttribute('data-handler-added')) {
                playerStatsElement.setAttribute('data-handler-added', 'true');
                playerStatsElement.addEventListener('click', () => {
                    this.showPlayerStatsModal();
                });
            }
        }
        
        console.log('UI updated');
    }

    // NEW: Get color for suspicion display based on danger level
    getSuspicionColor(suspicionPercent) {
        if (suspicionPercent >= 70) return '#ff0000'; // Red danger
        if (suspicionPercent >= 60) return '#ff6600'; // Orange warning
        if (suspicionPercent >= 40) return '#ffaa00'; // Yellow caution
        return '#444'; // Normal gray
    }

    // NEW: Show detailed player stats modal
    showPlayerStatsModal() {
        if (!this.player.vector) return;
        
        const modalHTML = `
            <div id="player-stats-modal" class="modal">
                <div class="modal-content">
                    <h3>Your Character Stats</h3>
                    <div style="text-align: left; margin: 20px 0;">
                        <h4>Personal Attributes:</h4>
                        <p><strong>Loyalty:</strong> ${Math.round(this.player.vector.loyalty * 100)}% - Your dedication to the empire</p>
                        <p><strong>Ambition:</strong> ${Math.round(this.player.vector.ambition * 100)}% - Your drive for power</p>
                        <p><strong>Influence:</strong> ${Math.round(this.player.vector.influence * 100)}% - Your political power</p>
                        <p><strong>Fear:</strong> ${Math.round(this.player.vector.fear * 100)}% - Your caution level</p>
                        
                        <h4 style="margin-top: 15px;">Court Reputation:</h4>
                        <p><strong>Perceived Loyalty:</strong> ${Math.round(this.player.reputation.perceivedLoyalty * 100)}%</p>
                        <p><strong>Perceived Threat:</strong> ${Math.round(this.player.reputation.perceivedThreat * 100)}%</p>
                        <p><strong>Political Skill:</strong> ${Math.round(this.player.reputation.politicalSkill * 100)}%</p>
                        <p><strong>Trustworthiness:</strong> ${Math.round(this.player.reputation.trustworthiness * 100)}%</p>
                    </div>
                    <button id="close-player-stats">Close</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        document.getElementById('close-player-stats').addEventListener('click', () => {
            document.getElementById('player-stats-modal').remove();
        });
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game');
    window.game = new HaremEmpireGame();
    console.log('Game initialized');
});