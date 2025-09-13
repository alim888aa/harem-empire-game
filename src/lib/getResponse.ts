
export function getResponseByType(characterName: string, responseType: 'ambitious_positive' | 'loyal_suspicious' | 'loyal_positive' | 'ambitious_dismissive' | 'fearful_appreciative' | 'neutral' ) {
    const responses = {
        ambitious_positive: [
            `${characterName}: "Finally, someone who recognizes true potential! Your words show wisdom."`,
            `${characterName}: "Yes, talent should be rewarded. Perhaps we think alike."`,
            `${characterName}: "The current system does waste so much potential... interesting perspective."`
        ],
        loyal_suspicious: [
            `${characterName}: "Such talk makes me very uncomfortable. I hope you're not serious about this."`,
            `${characterName}: "I... I think we should speak of other matters. The walls have ears."`,
            `${characterName}: "Your words concern me. I serve the empire faithfully."`
        ],
        loyal_positive: [
            `${characterName}: "Your dedication to the empire is admirable. We need more people like you."`,
            `${characterName}: "It's refreshing to meet someone who understands duty and honor."`,
            `${characterName}: "The empire is blessed to have servants like you."`
        ],
        ambitious_dismissive: [
            `${characterName}: "Such noble words... though I wonder if you truly understand how power works."`,
            `${characterName}: "Loyalty is admirable, but perhaps naive in these times."`,
            `${characterName}: "Your idealism is... charming."`
        ],
        fearful_appreciative: [
            `${characterName}: "Yes, we must be very careful. Thank you for understanding the dangers."`,
            `${characterName}: "Finally, someone who sees the risks we all face."`,
            `${characterName}: "Your caution shows wisdom. We must watch our steps."`
        ],
        neutral: [
            `${characterName}: "Thank you for the gift. Your words are thoughtful."`,
            `${characterName}: "I appreciate your generosity and your perspective."`,
            `${characterName}: "Your gift is welcome, as is your friendship."`
        ],
    };
    
    const responseList = responses[responseType] || responses.neutral;
    return responseList[Math.floor(Math.random() * responseList.length)];
}