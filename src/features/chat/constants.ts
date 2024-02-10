export interface ChatItemAction {
    pillText: string
    prompt?: string
    disabled?: boolean
    description?: string
}

export interface SourceLink {
    title: string
    url: string
    body?: string
}

export interface ReferenceTrackerInformation {
    licenseName?: string
    repository?: string
    url?: string
    recommendationContentSpan?: {
        start?: number
        end?: number
    }
    information: string
}

export interface ChatPrompt {
    prompt?: string
    escapedPrompt?: string
    command?: string
}

export enum VoteType {
    UP = 'upvote',
    DOWN = 'downvote',
}
