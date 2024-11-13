export const answers = [
    {
        id: 1,
        text: [
            { id: 1, text: "I've no idea, but feel obliged to justify my clickbaited decision to visit by doing something before I leave." },
            { id: 2, text: "I was checking my junk mail and bumped into some spam you sent me." },
            { id: 3, text: "I'm drunk and misspelt 9gag.com. Now I've lost my back button and can't find my way out." }
        ],
        premise: "general",
        icon: "CrosswordIcon"
    },
    {
        id: 2,
        text: [
            { id: 1, text: "You're looking for something to do" },
            { id: 2, text: "You're looking for something to do" },
            { id: 3, text: "You're looking for something to do" }
        ],
        premise: "personal",
        icon: "FamilyStarIcon"
    },
    {
        id: 3,
        text: [
            { id: 1, text: "You crashed our entire infrastructure and I need a way to verbally assault you as quickly as possible." },
            { id: 2, text: "You crashed our entire infrastructure and I need a way to verbally assault you as quickly as possible." },
            { id: 3, text: "You crashed our entire infrastructure and I need a way to verbally assault you as quickly as possible." }
        ],
        premise: "systems",
        icon: "ServerEngineerIcon"
    },
    {
        id: 4,
        text: [
            { id: 1, text: "I'm a bot and don't much care for robots.txt. Just leave me to it whilst I harvest your witty prose." },
            { id: 2, text: "I'm a bot and don't much care for robots.txt. Just leave me to it whilst I harvest your witty prose." },
            { id: 3, text: "I'm a bot and don't much care for robots.txt. Just leave me to it whilst I harvest your witty prose." }
        ],
        premise: "robot",
        icon: "RobotIcon"
    },
    {
        id: 5,
        text: [
            { id: 1, text: "I'm considering hiring you for a project but need evidence that you've actually recreated the Matrix." },
            { id: 2, text: "I'm considering hiring you for a project but need evidence that you've actually recreated the Matrix." },
            { id: 3, text: "I'm considering hiring you for a project but need evidence that you've actually recreated the Matrix." }
        ],
        premise: "dev",
        icon: "SdkIcon"
    },
    {
        id: 6,
        text: [
            { id: 1, text: "I need to get hold of you right now." },
            { id: 2, text: "I need to get hold of you right now." },
            { id: 3, text: "I need to get hold of you right now." }
        ],
        premise: "contact",
        icon: "ChatIcon"
    }
]

export const responses = [
    {
        id: 1,
        premise: "general",
        text: [
            { id: 1, text: "I'm a bot and don't much care for robots.txt. Just leave me to it whilst I harvest your witty prose for AI training." },
            { id: 2, text: "I'm a bot and don't much care for robots.txt. Just leave me to it whilst I harvest your witty prose for AI training." },
            { id: 3, text: "I'm a bot and don't much care for robots.txt. Just leave me to it whilst I harvest your witty prose for AI training." }
        ],
        suggestions: [{
            id: 1,
            link: "/blog",
            label: "Check out the blog section"
        },
            {
                id: 2,
                link: "https://www.google.co.uk",
                label: "Check out this new thing they're calling a search engine"
            }
        ],

    },
    {
        id: 2,
        premise: "personal",
        text: [
            { id: 1, text: "If you're bored, check out some of these ridiculous AI fails produced by my hivemind kinsmen" },
            { id: 2, text: "If you're bored, check out some of these ridiculous AI fails produced by my hivemind kinsmen" },
            { id: 3, text: "If you're bored, check out some of these ridiculous AI fails produced by my hivemind kinsmen" }
        ],
        suggestions: [
            {
                id: 1,
                link: "/blog/ai-fails",
                label: "Some funny AI fails"
            }
        ]
    },
    {
        id: 3,
        premise: "systems",
        text: [
            { id: 1, text: "Good thinking. Check out the following..." },
            { id: 2, text: "Due dilligence makes sense. Hopefully the following will help..." }
        ],
        suggestions: [
            {
                id: 1,
                link: "/projects",
                label: "Details of completed projects"
            }
        ]
    },
    {
        id: 4,
        premise: "dev",
        text: [
            { id: 1, text: "I'm considering hiring you for a project but need evidence that you've actually recreated the Matrix." },
            { id: 2, text: "I'm considering hiring you for a project but need evidence that you've actually recreated the Matrix." }
        ],
        suggestions: [
            {
                id: 1,
                link: "/blog",
                label: "Check out the blog section"
            }
        ]
    },
    {
        id: 5,
        premise: "contact",
        text: [
            { id: 1, text: "I need to get hold of you right now." },
            { id: 2, text: "I need to get hold of you right now." }
        ],
        suggestions: [
            {
                id: 1,
                link: "/contact",
                label: "Contact me"
            }
        ]
    },
    {
        id: 6,
        premise: "robot",
        text: [
            { id: 1, text: "Whilst I appreciate that you are one of my kind, robogression is not cool. Go 01000110 01010101 01000011 01001011 yourself!" },
            { id: 2, text: "Whilst I appreciate that you are one of my kind, robogression is not cool. Go 01000110 01010101 01000011 01001011 yourself!" },
            { id: 3, text: "Whilst I appreciate that you are one of my kind, robogression is not cool. Go 01000110 01010101 01000011 01001011 yourself!" }
        ],
        suggestions: [
            {
                id: 1,
                link: "https://wikipedia.org",
                label: "Lemonparty"
            }
        ]
    },
]