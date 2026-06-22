UPDATE notifications
SET message = replace(message, 'for the next round by Skyhigh', 'by <strong>Skyhigh</strong> after <strong>Round 1</strong>')
WHERE message LIKE '%for the next round by Skyhigh%';

UPDATE notifications
SET message = replace(message, 'for the final position at Skyhigh', 'by <strong>Skyhigh</strong> after the <strong>Final Round</strong>')
WHERE message LIKE '%for the final position at Skyhigh%';
