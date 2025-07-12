export function assignType(value, type) {

    if (type === 'text' || type === 'number') {
        return value != null ? value : "";
    }

    else if (type === 'currency') {
        return `$${value != null ? value : ""}`;
    }

    else if (type === 'date' && value != "") {
        const date = new Date(value);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        };
        return date.toLocaleDateString('en-US', options);
    }

    else {
        return ""
    }
}

export function createInput(type) {
    if (type === 'boolean') {
        return 'checkbox';
    }
    else {
        return '' + type;
    }
}

export function placeHolder(type) {
    if (type === 'text') {
        return 'Enter text';
    }

    else if (type === 'number') {
        return 'Enter number';
    }

    else if (type === 'currency') {
        return 'Enter amount';
    }

    else if (type === 'date') {
        return 'Select date';
    }

    else {
        return '';
    }
}