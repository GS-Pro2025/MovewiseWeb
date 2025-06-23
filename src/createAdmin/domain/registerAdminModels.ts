export interface Person {
    email: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    phone: string;
    address: string;
    id_number: string;
    type_id: string;
    id_company: number; 
}

export interface RegisterRequestBody {
    user_name: string;
    password: string;
    person: Person;
}