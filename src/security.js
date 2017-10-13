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

const module = {};
Object.defineProperty(module, 'principal', {
    enumerable: true,
    configurable: false,
    value: principal
});
export default module;