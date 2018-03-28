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

function login(user, password){
    return Requests.requestLogin(user, password, manager);
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