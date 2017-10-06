function download(name) {
    const a = document.createElement('a');
    a.download = name ? name : '';
    a.style.display = 'none';
    a.style.visibility = 'hidden';
    a.href = this.ocation;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

class Report {
    constructor(location) {
        this.location = location;
    }
    show() {
        download();
    }
    print() {
        download();
    }
    save(name) {
        download(this.location, name);
    }
}

export default Report;