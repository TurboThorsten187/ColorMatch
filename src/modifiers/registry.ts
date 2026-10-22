import { assemble } from "./assemble/assemble.ts";
import { background } from "./background/background.ts";
import { blink } from "./blink/blink.ts";
import { blur } from "./blur/blur.ts";
import { countUp } from "./countUp/countUp.ts";
import { doubleTap } from "./doubleTap/doubleTap.ts";
import { fontFlip } from "./fontFlip/fontFlip.ts";
import { invertInput } from "./invertInput/invertInput.ts";
import { mirror } from "./mirror/mirror.ts";
import { moving } from "./moving/moving.ts";
import { negative } from "./negative/negative.ts";
import { noClick } from "./noClick/noClick.ts";
import { pulsing } from "./pulsing/pulsing.ts";
import { rotation } from "./rotation/rotation.ts";
import { scrambled } from "./scrambled/scrambled.ts";
import { shaky } from "./shaky/shaky.ts";
import { spam } from "./spam/spam.ts";
import { splitMirror } from "./splitMirror/splitMirror.ts";
import { twoWords } from "./twoWords/twoWords.ts";
import type { ModifierGroup, ModifierGroupId } from "./types.ts";
import { wait } from "./wait/wait.ts";
import { zoom } from "./zoom/zoom.ts";

// Every modifier group by its id: a group missing here does not compile
const GROUPS: Readonly<Record<ModifierGroupId, ModifierGroup>> = {
    mirror,
    rotation,
    pulsing,
    shaky,
    background,
    blur,
    moving,
    noClick,
    blink,
    scrambled,
    invertInput,
    spam,
    zoom,
    splitMirror,
    countUp,
    assemble,
    fontFlip,
    negative,
    wait,
    doubleTap,
    twoWords,
};

// All groups, in this order wherever a list of them is shown or worked through
export const MODIFIER_GROUPS: readonly ModifierGroup[] = Object.values(GROUPS);

export function groupById(id: ModifierGroupId): ModifierGroup {
    return GROUPS[id];
}

// Groups that never share a level: two rule groups, or one names the other
export function conflicts(a: ModifierGroupId, b: ModifierGroupId): boolean {
    const first = GROUPS[a];
    const second = GROUPS[b];
    return (
        (first.rule !== undefined && second.rule !== undefined) ||
        (first.conflictsWith?.includes(b) ?? false) ||
        (second.conflictsWith?.includes(a) ?? false)
    );
}

// The groups in the order of MODIFIER_GROUPS
export function inGroupOrder(ids: readonly ModifierGroupId[]): ModifierGroupId[] {
    return MODIFIER_GROUPS.filter((group) => ids.includes(group.id)).map((group) => group.id);
}
