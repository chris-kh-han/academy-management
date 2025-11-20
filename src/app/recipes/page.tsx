import { getAllRecipes } from '@/utils/supabase/supabase';
import { RecipesTable } from './_components/RecipesTable';

type Recipe = {
  menu_id: string;
  ingredient_id?: string;
  ingredient_name?: string;
  required_qty?: number;
  [key: string]: any;
};

const Recipes = async () => {
  const recipes = await getAllRecipes();

  console.log(recipes);

  const grouped = (recipes ?? []).reduce(
    (acc: Record<string, Recipe[]>, cur: Recipe) => {
      const id = cur.menu_id ?? 'unknown';
      if (!acc[id]) acc[id] = [];
      acc[id].push(cur);
      return acc;
    },
    {} as Record<string, Recipe[]>,
  );

  return (
    // <table>
    //   <thead>
    //     <tr>
    //       <th>메뉴ID</th>
    //       <th>재료 목록</th>
    //     </tr>
    //   </thead>
    //   <tbody>
    //     {Object.entries(grouped).map(([menuId, items]) => (
    //       <tr key={menuId}>
    //         <td>{menuId}</td>
    //         <td>
    //           <ul className='list-disc pl-5'>
    //             {items.map((i) => (
    //               <li key={i.ingredient_id || i.ingredient_name}>
    //                 {i.ingredient_name} — {i.required_qty}
    //               </li>
    //             ))}
    //           </ul>
    //         </td>
    //       </tr>
    //     ))}
    //   </tbody>
    // </table>
    <RecipesTable />
  );
};

export default Recipes;
