"use strict";

let activeNetwork = null;

function parseCRN(textarea) {
    // parse the network and assign to global variable
    activeNetwork = new CRNTK(textarea.value);

    // trigger the review
    reviewCRN(document.getElementById("crn_review"));
    document.links[1].click();
}

function reviewCRN(table) {
    const section = table.tBodies[0];
    while (section.hasChildNodes()) {
        section.removeChild(section.lastChild);
    }

    const complexes = new Array(activeNetwork.complexes.size);
    for (const [complex, [index, _]] of activeNetwork.complexes.entries()) {
        complexes[index] = complex.replace(/\b1\*/g, '');
    }

    let k = 0;
    for (const [i, j] of activeNetwork.reactions) {
        const reversible = activeNetwork.reactions.has(j, i);

        // be smart about reversible reactions
        if (j < i && reversible) {
            continue;
        }

        k += 1;
        const row = section.insertRow(-1);

        const name = row.insertCell(-1).appendChild(document.createElement("input"));
        name.type = "text";
        name.value = "R" + k;
        name.setAttribute('data-lhs', i);
        name.setAttribute('data-rhs', j);
        name.setAttribute('data-rev', 1 * reversible);
        row.insertCell(-1).appendChild(document.createTextNode(complexes[i]));
        row.insertCell(-1).appendChild(document.createTextNode(reversible ? '⇄' : '→'))
        row.insertCell(-1).appendChild(document.createTextNode(complexes[j]));
    }
};


let clawWorker = null;
function startClaws(textarea) {
    if (clawWorker !== null) {
        stopClaws(textarea);
    }
    const {rows, cols} = activeNetwork.stoichiometry();
    clawWorker = new Worker('claws.js');
    clawWorker.onmessage = function(e) {
        const [kind, msg] = e.data;
        if (kind === 'progress') {
            textarea.value = msg + ' remaining of ' + rows.length;
        } else if (kind === 'complete') {
            textarea.value = msg.map(
                row => row.map(
                    ([i, x]) => (x == 1) ? cols[i] : (x + '*' + cols[i])
                ).join(' + ')
            ).join('\n');
        }

    }
    clawWorker.postMessage([rows, cols.length]);
}
function stopClaws(textarea) {
    if (clawWorker !== null) {
        clawWorker.terminate();
        textarea.value = 'Aborted calculation!';
    }
}

let pathWorker = null;
function startPaths(textarea) {
    if (pathWorker !== null) {
        stopPaths(textarea);
    }
    const {rows, cols} = activeNetwork.stoichiometry();
    pathWorker = new Worker('claws.js');
    pathWorker.onmessage = function(e) {
        textarea.value = e.data + ' remaining of ' + rows.length;
    }
    pathWorker.postMessage([rows, cols.length]);
}
function stopPaths(textarea) {
    if (pathWorker !== null) {
        pathWorker.terminate();
        textarea.value = 'Aborted calculation!';
    }
}
