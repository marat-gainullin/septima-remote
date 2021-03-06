import Requests from './requests';

class Principal {

    constructor(name) {
        this.name = name;
    }

    hasRole() {
        return true;
    }

    logout(manager) {
        return Requests.requestLogout(manager);
    }
}

function principal(manager) {
    return Requests.requestLoggedInUser(manager)
        .then(userName => {
            return new Principal(userName);
        });
}

function login(user, password, keepMe = false, manager = null) {
    return Requests.requestLogin(user, password, manager)
        .then(() => principal(manager))
        .then(p => {
            if (p.name.startsWith('anonymous')) {
                throw p;
            } else {
                return p;
            }
        })
        .then(loggedIn => {
            if (keepMe) {
                return Requests.requestKeepMe(manager).then(() => loggedIn);
            } else {
                return loggedIn;
            }
        });
}

const module = {};
Object.defineProperty(module, 'principal', {
    enumerable: true,
    configurable: false,
    value: principal
});
Object.defineProperty(module, 'login', {
    enumerable: true,
    configurable: false,
    value: login
});
export default module;