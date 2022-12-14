import connection from "../databases/pgsql.js";
import { STATUS_CODE } from "../enums/statusCode.js";

export async function getUser(req, res) {
  const { idUser } = res.locals;

  try {
    const user = (
      await connection.query(`SELECT * FROM users WHERE id=$1;`, [idUser])
    ).rows[0];

    if (!user) {
      return res.sendStatus(STATUS_CODE.NOT_FOUND);
    }

    const visitCountTotal = (
      await connection.query(
        `
            SELECT COUNT("visit_count") 
            FROM views 
            JOIN links 
                ON views."link_id" = links.id 
            WHERE "user_id"=$1 
            GROUP BY links."user_id";
        `,
        [idUser]
      )
    ).rows[0];

    const shortened = await connection.query(
      `
            SELECT 
                links.id, 
                links.short_url AS "shortUrl", 
                links.link_url AS "url", 
                COUNT("visit_count") AS "visitCount"
            FROM links
            LEFT JOIN views
                ON views."link_id" = links.id
            WHERE links."user_id"=($1)
            GROUP BY links.id;
        `,
      [idUser]
    );

    const infoUser = {
      id: idUser,
      name: user.name,
      visitCount: visitCountTotal ? visitCountTotal.count : 0,
      shortenedUrls: shortened.rows,
    };

    return res.status(STATUS_CODE.OK).send(infoUser);
  } catch (err) {
    console.error(err);
    return res.sendStatus(STATUS_CODE.SERVER_ERROR);
  }
}

export async function getRanking(req, res) {
  try {
    const ranking = (
      await connection.query(`
        SELECT 
            users.id, users.name, COALESCE(l."linksCount", 0) AS "linksCount", COALESCE(v."visitCount", 0) AS "visitCount"
        FROM users
        LEFT JOIN
        (SELECT 
            users.id, users.name, COUNT(links.id) AS "linksCount"
        FROM links
        JOIN users
            ON links."user_id" = users.id
        GROUP BY users.id) l
            ON users.id = l.id
        LEFT JOIN
        (SELECT 
            links."user_id", COUNT(views.id) AS "visitCount"
        FROM views
        JOIN links
            ON views."link_id" = links.id
        GROUP BY links."user_id") v
        ON users.id = v."user_id"
        ORDER BY v."visitCount" DESC NULLS LAST, l."linksCount" DESC NULLS LAST
        LIMIT 10;
    `)
    ).rows;

    return res.status(STATUS_CODE.OK).send(ranking);
  } catch (err) {
    console.error(err);
    return res.sendStatus(STATUS_CODE.SERVER_ERROR);
  }
}
