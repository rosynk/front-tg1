export interface PixDto {
  chavePixDestino: string; // Nome que o Java espera
  valor: number;
  mensagem?: string;       // Equivalente ao 'descricao' que o erro mencionou
}

export interface User {
  id: string;
  email: string;
  nome?: string;          // O que o seu Guardian está vendo
  nomeCompleto?: string;  // O que o seu Hibernate está enviando
  role: string;
}
export interface PixApiResponse {
  sucesso: boolean;        // Resolve o erro "property sucesso does not exist"
  mensagem: string;
  dados: any;
}
