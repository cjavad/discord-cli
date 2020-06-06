import { SemanticAST } from '../../types/ast';
import { Token } from '../../types/tokens';
import { DiscordQueryParsingError } from '../errors';
import { EngineCall } from '../../types/engine';

/**
     * Create callstack for show keyword
     * @param semanticCommand - Parsed AST Entry
     */
export default function kShow (semanticCommand: SemanticAST): Array<EngineCall> {
    const callstack: Array<EngineCall> = [];
    if (semanticCommand.target && semanticCommand.target.annotation === Token.g) {
        if (!/\d{18}/.test(semanticCommand.target.value)) throw new DiscordQueryParsingError(semanticCommand.target.index, semanticCommand.target.annotation);
        callstack.push({ command: 'selectGuild', args: [semanticCommand.target.value] });
        callstack.push({ command: 'showChannels', args: [semanticCommand.target.value] });
        callstack.push({ command: 'showMembers', args: [semanticCommand.target.value] });
    } else {
        callstack.push({ command: 'showGuilds', args: [] });
    }
    return callstack;
}